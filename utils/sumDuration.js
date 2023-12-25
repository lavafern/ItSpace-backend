const {prisma} = require('../libs/prismaClient');

module.exports = {
    sumDurationCourse : async () => {
        //summing duration
        const sumDurationByChapter = await prisma.video.groupBy({
            by : 'chapterId',
            _sum : {
                duration : true
            },
            
        });


        const sumDurationMapCourse = await Promise.all( sumDurationByChapter.map(async (chapter) => {
            const findChapter = await prisma.chapter.findUnique({
                where : {
                    id : chapter.chapterId
                },
                select : {
                    course : {
                        select : {
                            id : true
                        }
                    }
                }
            });

            const courseId = findChapter.course.id;
            chapter.courseId = courseId;
            return chapter;

        }));

        ///group by course
        const sumDurationByCourse = {};

        sumDurationMapCourse.forEach(sum => {
            if (!(sum.courseId in sumDurationByCourse)) {
            
                sumDurationByCourse[sum.courseId] = 0;

            }

            sumDurationByCourse[sum.courseId] += sum._sum.duration;

        });


        return sumDurationByCourse;

    },

    sumDurationChapter : async (chapterIds) => {

        //summing duration
        const sumDurationByChapter = await prisma.video.groupBy({
            by : 'chapterId',
            _sum : {
                duration : true
            },
            where : {
                OR : chapterIds
            }
        });

        return sumDurationByChapter;
    }
};