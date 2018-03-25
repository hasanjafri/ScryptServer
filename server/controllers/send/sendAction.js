import nodemailer from 'nodemailer';
import request from 'request';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'yungunpatron@gmail.com',
        clientId: '512173274192-hnugk1kvbp8i3gf853ar423km4dstaeo.apps.googleusercontent.com',
        clientSecret: 'i8rytuaGlOcvqJstiwUeFyFw',
        refreshToken: '1/iloPJbI5NVNcRzauNT8Ic5V1Ojhq38ti6Z7UJ5dAP1cbyS_IATAi9g2w6mqWVJyy',
        accessToken: 'ya29.GlsbBGla1fXW6elBKlKgMXnWjLSNs1OwDOfGT14eaUbQgB6CAZJJn_5k8wtQTxrFW-vczS4XgLmNCuGMSOFoqH-weluKWFGTl0eIm4mlGbtG0iSHx-rOmsQpkTlD'
    }
});

function sendEmail({ message, title, email, from, replaceFrom }) {
    return new Promise (resolve => {
        if (!email) {
            return resolve({ message: `No email specified `});
        }
        from = from ? from : process.env.DEFAULT_EMAIL;
        if (process.env.DEV_ENABLE_TEST_EMAIL === 'true') { 
            message = replaceFrom ? message.replace(':email', from) : message;
            transporter.sendMail({
                from,
                to: email,
                subject: title,
                html: message
            }, (err, info) => resolve(err));
        } else {
            // TODO: set up a real email account for production
        }
    });
}

export { sendEmail };