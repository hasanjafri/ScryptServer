import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import crypto from 'crypto';

import { capitalize } from '../../utils';
import { jsonErr, jsonSuccess, jsonValidationErr } from '../../utils/json';
import { sendEmail } from '../send/sendAction';
import { createCustomer } from '../stripe/stripeAction';
import constants from '../../utils/constants';

import User from './../../models/User';

const urlParser = require('url');

const userHandler = {};

userHandler.get = (req, res) => {
    User.findOne({ _id: req.user._id }).select('-password -_id').then(user => jsonSuccess(res, user));
};

userHandler.getAll = (req, res) => {
    User.find({}).select('-password').sort('-createdAt').then(users => jsonSuccess(res, users)).catch(err => jsonErr(res, err));
};

userHandler.login = (req, res) => {
    User.findOne({ username: req.body.username }).then(user => {
        if (!user) {
            return jsonErr(res, 'Authentication failed. Invalid user or password', 401);
        }
        if (user.verification && !user.verification.status) {
            return jsonErr(res, 'Account not verified', 401);
        }
        if ( !user.comparePassword(req.body.password)) {
            return jsonErr(res, 'Authentication failed. Invalid user or password', 401);
        }

        const { username, _id } = user;
        const token = jwt.sign({ username, _id }, process.env.JWT_KEY, {
            expiresIn: 600000
        });

        return jsonSuccess(res, { token });
    }).catch(err => jsonErr(res, err));
};

userHandler.register = (req, res) => {
    const { firstName, lastName, username, password, confirmPassword } = req.body;
    // Validation
    if (!firstName || !lastName || !username || !password || !confirmPassword) {
        return jsonErr(res, 'All fields must be completed.');
    } else if (!username.includes('@')) {
        return jsonErr(res, 'Username must be an e-mail.');
    } else if (username.length < 5) {
        return jsonErr(res, 'Username has to be greater than 5 characters.')
    } else if (password !== confirmPassword) {
        return jsonErr(res, 'Passwords do not match.');
    }
    req.body.confirmPassword = undefined;
    req.body.fullName = `${capitalize(firstName)} ${capitalize(lastName)}`;
    User.findOne({ username }).then(existingUser => {
        if (existingUser) {
            return jsonErr(res, 'This usename already exists.');
        }
        crypto.randomBytes(20, (err, buf) => {
            if (err) {
                return jsonErr(res, err);
            }
            const newUser = new User(req.body);
            newUser.password = bcrypt.hashSync(req.body.password, 10);
            newUser.verification.token = buf.toString('hex');
            newUser.verification.expiry = Date.now() + constants.VERIFICATION_TOKEN_EXPIRE_TIME;
            newUser.save().then(user => {
                const refererUrl = urlParser.parse(req.headers.referer ? req.headers.referer : process.env.UI_HOST);
                const link = `${refererUrl.protocol}//${refererUrl.host}/login/verify/${buf.toString('hex')}`;
                sendEmail({
                    title: 'Scrypt server account verification',
                    message: `Click the following link or copy paste it in your browser to confirm your account: <a href="${link}">${link}</a>`,
                    email: user.username
                }).then(() => {
                    // create stripe account
                    createCustomer({ user }).then(customer => {
                        console.log(customer);
                        user.password = undefined;
                        user.verification = undefined;
                        return jsonSuccess(res, user);
                    }).catch(err => jsonErr(res, err));
                }).catch(err => jsonErr(res, err));
            }).catch(err => jsonErr(res, err));
        });
    });
};

userHandler.resendVerificationEmail = (req, res) => {
    const { email } = req.body;
    
    // Validation
    if (!email) {
        return jsonValidationErr(res);
    }

    User.findOne({ username: email }).then(user => {
        if (!user) {
            return jsonSuccess(res, 'No such user', false);
        } else {
            crypto.randomBytes(20, (err, buf) => {
                if (err) {
                    return jsonSuccess(res, 'Cannot generate token', false);
                }
                if (user.verification.status) {
                    return jsonSuccess(res, 'This account is already verified', false);
                }
                user.verification.token = buf.toString('hex');
                user.verification.expiry = Date.now() + constants.user.VERIFICATION_TOKEN_EXPIRE_TIME;
                user.save().then(() => {
                    const refererUrl = urlParser.parse(req.headers.referer);
                    const link = `${refererUrl.protocol}//${refererUrl.host}/login/verify/${buf.toString('hex')}`;
                    sendEmail({
                        title: 'Scrypt account verification',
                        message: `Click the following link or copy paste it in your browser to confirm your account: <a href="${link}">${link}</a>`,
                        email: user.username
                    }).then(() => {
                        return jsonSuccess(res, `An e-mail has been sent to ${user.username} with further instructions`);
                    }).catch(err => {
                        return jsonErr(res, err); 
                    });
                })
            });
        }
    }).catch(err => jsonErr(res, err));
}

userHandler.verifyToken = (req, res) => {
    const { token } = req.params;

    // Validation
    if (!token) {
        return jsonValidationErr(res);
    }

    User.findOne({
        'verification.token': token,
        'verification.expiry': { $gt: Date.now() }
    }).then(user => {
        if (!user) {
            return jsonSuccess(res, 'Verification token is invalid or has expired', false);
        } else {
            user.verification.status = true;
            user.verification.token = undefined;
            user.verification.expiry = undefined;
            user.save().then(() => jsonSuccess(res, 'Your account is verified'));
        }
    });
}

userHandler.resetPassword = (req, res) => {
    const { email } = req.body;
    
    // Validation
    if (!email) {
        return jsonValidationErr(res);
    }

    const createExpirationToken = new Promise((resolve, reject) => {
        crypto.randomBytes(20, (err, buf) => {
            return err ? reject(err) : resolve(buf.toString('hex'));
        });
    });
    
    createExpirationToken.then(token => {
        User.findOne({ username: email }).then(user => {
            if (!user) {
                return jsonSuccess(res, 'No such user', false);
            } else {
                user.resetPassword.token = token;
                user.resetPassword.expiry = Date.now() + constants.RESET_PASSWORD_EXPIRE_TIME;
                user.save().then(() => {
                    const refererUrl = urlParser.parse(req.headers.referer);
                    const link =  `${refererUrl.protocol}//${refererUrl.host}/login/reset/${token}`
                    sendEmail({
                        title: 'Scrypt Password Reset',
                        message: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                            Please click on the following link, or paste this into your browser to complete the process:  <a href="${link}">${link}</a>\n\n
                            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
                        email: user.username
                    }).then(() => {
                        return jsonSuccess(res, `An e-mail has been sent to ${user.username} with further instructions`);
                    }).catch(err => jsonErr(res, err));
                });
            }
        });
    });
}

userHandler.changePassword = (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
        return jsonValidationErr(res);
    }
    if (password !== confirmPassword) {
        return jsonSuccess(res, 'Passwords do not match', false);
    }
    User.findOne({
        'resetPassword.token': token,
        'resetPassword.expiry': { $gt: Date.now() }
    }).then(user => {
        if (!user) {
            return jsonSuccess(res, 'Password reset token is invalid or has expired', false);
        } else {
            user.password = bcrypt.hashSync(password, 10);
            user.save().then(() => {
                sendEmail({
                    title: 'Your password has been changed',
                    title: 'Your password has been changed',
                    message: `Hello,\n\nthis is a confirmation that the password for your Scrypt account ${user.username} has just been changed.\n`,
                    email: user.username
                }).then(() => jsonSuccess(res, 'Password has been reset'))
                .catch(err => jsonErr(res, err));
            }).catch(err => jsonErr(res, err));
        }
    });
};

export default userHandler;
