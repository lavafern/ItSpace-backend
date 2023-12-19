const { BadRequestError } = require('../errors/customErrors');
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