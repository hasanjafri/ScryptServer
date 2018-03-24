import app from './app';

if (process.env.ENVIRONMENT === 'c9') {
    app.listen(process.env.PORT, process.env.IP, () => {
        console.log(`Running on port ${process.env.PORT}...`);
    });
} else {
    app.listen(process.env.SERVER_PORT, () => {
        console.log(`Running on port ${process.env.SERVER_PORT}...`);
    });
}
