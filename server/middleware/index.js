import jwt from 'jsonwebtoken';

import { jsonErr, jsonSuccess, jsonValidationErr } from '../utils/json';

import User from '../models/User';

const middleware = {};

middleware.isLoggedIn = (req, res, next) => {
    if (process.env.DEV_DISABLE_LOGIN === 'true') {
        return next();
    }
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_KEY, (err, decodedUser) => {
            if (err) return jsonErr(res, 'Not authenticated', 401);
            User.findOne({ _id: decodedUser._id }).then(user => {
                req.user = user;
                next();
            }).catch(err => jsonErr(res, 'No user found'));
        });
    } else {
        return jsonErr(res, 'Not authenticated');
        next();
    }
}
middleware.isAdminLoggedIn = (req, res, next) => {
    if (process.env.DEV_DISABLE_LOGIN === 'true') {
        return next();
    }
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_KEY, err, decodedUser => {
            if (err) return jsonErr(res, 'Not authenticated', 401);
            User.findOne({ _id: decodedUser._id, admin: true }).then(user => {
                if (!user) {
                    return jsonErr(res, 'Not allowed');
                }
                req.user = user;
                next();
            }).catch(err => jsonErr(res, 'No user found'));
        });
    } else {
        return jsonErr(res, 'Not authenticated');
        next();
    }
}

export default middleware;