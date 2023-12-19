const nodemailer = require('nodemailer');
require('dotenv').config();
const {GOOGLE_APP_PASSWORD,APP_EMAIL} = process.env;

module.exports = {
    sendEmail : (to,subject,html) => {
       
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: APP_EMAIL,
                pass: GOOGLE_APP_PASSWORD,
            },
        });
      
        //Step 2: Setting up message options
        const messageOptions = {
            subject: subject,
            html: html,
            to: to,
            from: APP_EMAIL,
        };
      
        //Step 3: Sending email
        transporter.sendMail(messageOptions);
    }
};