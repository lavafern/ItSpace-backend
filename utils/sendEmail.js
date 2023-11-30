const nodemailer = require("nodemailer")
require("dotenv").config()
const {GOOGLE_APP_PASSWORD,APP_EMAIL} = process.env
const {otpHtml} = require("../views/templates/emailVerification")


module.exports = {
    sendEmail : (to,subject,html) => {
        try {
            
       
       
       
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
        transporter.sendMail(messageOptions)
        
        } catch (err) {
            next(err)
        }

    }
    

}