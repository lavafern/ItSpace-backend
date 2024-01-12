const nodemailer = require('nodemailer');
require('dotenv').config();
const {GOOGLE_APP_PASSWORD,APP_EMAIL} = process.env;

module.exports = {
    sendEmail : async (to,subject,html) => {
       
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: APP_EMAIL,
                pass: GOOGLE_APP_PASSWORD,
            },
        });

        await new Promise((resolve, reject) => {
            // verify connection configuration
            transporter.verify(function (error, success) {
                if (error) {
                    console.log(error);
                    reject(new Error('nodemailer failed to verify connection'));
                } else {
                    resolve(success);
                }
            });
        });
      
        //Step 2: Setting up message options
        const messageOptions = {
            subject: subject,
            html: html,
            to: to,
            from: APP_EMAIL,
        };
      
        //Step 3: Sending email
        await new Promise((resolve, reject) => {
            // send mail
            transporter.sendMail(messageOptions, (err, info) => {
                if (err) {
                    console.error(err);
                    reject(new Error('nodemailer failed to send mail'));
                } else {
                    resolve(info);
                }
            });
        });
    }
};