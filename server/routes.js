import express from 'express';
import middleware from './middleware';

// Controller Imports
import userHandler from './controllers/user/userHandler';

const routes = express();

routes.get('/welcome', (req, res) => {
	res.send('Welcome to our API.');
});

// User Routes
routes.post('/register', userHandler.register);
routes.get('/register/:token', userHandler.verifyToken)
routes.post('/login', userHandler.login);
routes.get('/user', middleware.isLoggedIn, userHandler.get);
routes.post('/user/resetPassword', userHandler.resetPassword);
routes.post('/user/changePassword', userHandler.changePassword);
routes.post('/user/resendVerificationEmail', userHandler.resendVerificationEmail);

// Admin

export default routes;