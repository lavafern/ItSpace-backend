const cron = require('node-cron');
const { prisma } = require('../libs/prismaClient');
const { sendEmail } = require('./sendEmail');
require('dotenv').config();
const {reminderHtml} = require('../views/templates/continueLearningReminder');
const {FRONTEND_HOME_URL} = process.env;

module.exports  = {
    continueLearningReminder : () => {
        cron.schedule('0 0 * * 0', async function() {
            const matchEnrollment = await prisma.enrollment.findMany({
                where : {
                    NOT : [
                        {lastAccessed : null},
                        {completed : true}
                    ],
                    lastAccessed : {
                        lte : new Date((new Date().setDate(new Date().getDate() - 3)))
                    },
                },
                include : {
                    author : {
                        include : {
                            profile : true
                        }
                    },
                    course : true
                }
            });


            // send email to each user that hasnt open course page
            Promise.all(matchEnrollment.map( async (i) => {
                const html = reminderHtml(i.author.profile.name,i.course.title,FRONTEND_HOME_URL);
                await sendEmail(i.author.email,'Mari Lanjutkan Belajar Anda!',html);
            }));

        });
    }
};