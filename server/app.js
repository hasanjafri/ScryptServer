import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

import routes from './routes';

mongoose.Promise = global.Promise;

const mongoosePromise = mongoose.connect(process.env.MONGO_CONNECTION);
mongoosePromise.then(dbConnection => {
    if (dbConnection) {
        console.log('Connected to mongodb...');
    } else {
        console.warn('Cannot connect to mongodb!')
    }
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});
app.use('/api', routes);
app.use((req, res) => json.err(res, {
    url: `${req.originalUrl} not found`
}, 404));

export default app;