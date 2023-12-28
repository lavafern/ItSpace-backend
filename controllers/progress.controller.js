const { BadRequestError, CourseNotPurchasedError } = require('../errors/customErrors');
const { prisma } = require('../libs/prismaClient');

module.exports = {
    createProgress : async (req,res,next) => {
        try {
            const userId = req.user.id;
            let {videoId} = req.body;
            
            if (!videoId) throw new BadRequestError('Tolong masukan videoId');
            if (isNaN(Number(videoId))) throw new BadRequestError('videoId harus integer');
            videoId = Number(videoId);

            // checks if videoId is exist
            const checkVideo = await prisma.video.findUnique({
                where : {
                    id : videoId
                }
            });

            if (!checkVideo) throw new BadRequestError('VideoId tidak ditemukan');


            // find chapterId
            const chapter = await prisma.chapter.findUnique({
                where : {
                    id : checkVideo.chapterId
                }
            });


            // find courseId
            const course = await prisma.course.findUnique({
                where : {
                    id : chapter.courseId
                },
                include : {
                    chapter : true
                }
            });


            //check enrollment
            const checkEnrollment = await prisma.enrollment.findMany({
                where : {
                    authorId : userId,
                    courseId : course.id
                }
            });

            if (checkEnrollment.length < 1) throw new CourseNotPurchasedError('Anda harus daftar kelas ini untuk memperi progress');

            // checks if progress is already exist

            const checkProgress = await prisma.progress.findMany({
                where : {
                    videoId,
                    authorId : userId
                },
                select : {
                    id : true,
                    completedDate : true,
                    video : {
                        select : {
                            id : true,
                            title : true,
                        }
                    },
                    author : {
                        select : {
                            id : true,
                            profile : {
                                select : {
                                    name : true
                                }
                            }
                        }
                    }
                }
            });



            if (checkProgress.length > 0) {
                return res.status(200).json({
                    success : true,
                    message : 'You have already done this video',
                    data : checkProgress
                });
            } 

            const newProgress = await prisma.progress.create({
                data : {
                    videoId,
                    authorId : userId,
                    completedDate : new Date()
                },
                select : {
                    id : true,
                    completedDate : true,
                    video : {
                        select : {
                            id : true,
                            title : true,
                        }
                    },
                    author : {
                        select : {
                            id : true,
                            profile : {
                                select : {
                                    name : true
                                }
                            }
                        }
                    }
                }
            });


            // get all chapter Id of all course of this video
            const chapterIds = course.chapter.map((chapter) => {
                return {chapterId :chapter.id};
            });

            // get video count and progress count of this course
            const videosOfCourse = await prisma.video.findMany({
                where : {
                    OR : chapterIds
                },
                select : {
                    id : true,
                    title : true,
                    _count : {
                        select : {
                            progress : {
                                where : {
                                    authorId : userId
                                }
                            }
                        }
                    }
                }
            });
 
            const progressOfCourse = videosOfCourse.filter((videos) => videos._count.progress);

            if (videosOfCourse.length === progressOfCourse.length) {
                await prisma.enrollment.update({
                    where : {
                        author : userId,
                        courseId : course.id
                    },
                    data : {
                        completed : true
                    }
                });

                await prisma.notification.create({
                    data : {
                        author : userId,
                        created_at : new Date(),
                        is_read : false,
                        type : 'Pencapaian',
                        message : `Selamat! Anda baru saja menyelesaikan kursus ${course.title} di itSpace!, Teruskan semangat belajar Anda!`,
                    }
                });
    
            }

            return res.status(201).json({
                success : true,
                message : 'Successfully create new progress',
                data : newProgress
            });
        } catch (err) {
            next(err);
        }
    }
};