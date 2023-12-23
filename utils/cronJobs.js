const cron = require('node-cron');
// const { prisma } = require('../libs/prismaClient');

module.exports  = {
    continueLearningReminder : () => {
        cron.schedule('*/10 * * * * *', function() {
            console.log('Running task every second');
        });
    }
};