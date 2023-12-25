const { prisma } = require('../libs/prismaClient');
const { BadRequestError, NotFoundError, CourseNotPurchasedError } = require('../errors/customErrors');

module.exports = {
    createVideo: async (req, res, next) => {
        try {
            let {title, description, url, duration,number} = req.body;
            let { courseId, chapterId } = req.params;
      
      
            if (!title || !description || !url || !duration || !number) throw new BadRequestError('Harap isi semua kolom');
            if (isNaN(Number(duration))) throw new BadRequestError('Duration harus berupa Angka');
            if (isNaN(Number(number))) throw new BadRequestError('Number harus berupa Angka');
            if (!courseId || !chapterId) throw new BadRequestError('Course dan Chapter harus diisi');
            if (isNaN(Number(courseId)) || isNaN(Number(chapterId))) throw new BadRequestError('ID Harus Berupa Angka');
      

            duration = Number(duration);
            number = Number(number);
            courseId = Number(courseId);
            chapterId = Number(chapterId);

            //cek jika course id ada
            let checkCourse = prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });


            // cek jika chapterId ada
            let checkChapter = prisma.chapter.findUnique({
                where: {
                    id: chapterId,
                },
                include : {
                    course : true
                }
            });

            [checkCourse,checkChapter] = await Promise.all([checkCourse,checkChapter]);

            if (!checkCourse)throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!checkChapter) throw new NotFoundError('Chapter dengan id tersebut tidak ada');
            if (checkChapter.course.id !== courseId) throw new BadRequestError('Chapter ini bukan berasal dari course ini');

            // validasi number apabila sudah digunakan
            const checkVideoNumber = await prisma.video.findMany({
                where: {
                    number,
                    chapterId
                },
            });

            if (checkVideoNumber.length > 0 ) throw new BadRequestError('Video dengan nomor tersebut sudah digunakan di chapter ini');    

            const newVideo = await prisma.video.create({
                data:{
                    title,
                    description,
                    url,
                    duration,
                    chapterId,
                    number
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    duration: true,
                    number : true,
                    chapter: {
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            isPremium: true,
                        },
                    },
                },
            });

            res.status(201).json({
                success: true,
                message: 'Berhasil membuat video baru',
                data: newVideo,
            });

        } catch (err) {
            next(err);
        }
    },

    getAllVideoForChapter : async (req,res,next) => {
        try {
            let { courseId, chapterId } = req.params;

            if (!courseId || !chapterId) throw new BadRequestError('Course dan Chapter harus diisi');
            if (isNaN(Number(courseId)) || isNaN(Number(chapterId))) throw new BadRequestError('ID Harus Berupa Angka');
      
            courseId = Number(courseId);
            chapterId = Number(chapterId);

            let checkCourse = prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

            // Mengasumsikan ada model video dengan kolom: id, title, description, url, duration
            let checkChapter = prisma.chapter.findUnique({
                where: {
                    id: chapterId,
                },
                include : {
                    course : true
                }
            });

            [checkCourse,checkChapter] = await Promise.all([checkCourse,checkChapter]);

            if (!checkCourse)throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!checkChapter) throw new NotFoundError('Chapter dengan id tersebut tidak ada');
            if (checkChapter.course.id !== courseId) throw new BadRequestError('Chapter ini bukan berasal dari course ini');

            const allVideoOfChapter = await prisma.video.findMany({
                where : {
                    chapterId : chapterId
                }
            });

            res.status(200).json({
                success: true,
                message: 'Succesfully get all video of chapter',
                data: allVideoOfChapter,
            });
        } catch (err) {
            next(err);
        }
    },
  
    getVideoDetails: async (req, res, next) => {
        try {

            const userId = req.user.id;
      
            let { courseId, chapterId, id } = req.params;

            if (!id) throw new BadRequestError('Video ID harus diisi');
            if (isNaN(Number(id))) throw new BadRequestError('ID Harus Berupa Angka');
            if (!courseId || !chapterId) throw new BadRequestError('Course dan Chapter harus diisi');
            if (isNaN(Number(courseId)) || isNaN(Number(chapterId))) throw new BadRequestError('ID Harus Berupa Angka');

            id = Number(id);
            courseId = Number(courseId);
            chapterId = Number(chapterId);

            const checkCourseTask = prisma.course.findUnique({
                where : {
                    id: courseId,
                },
            });

            const checkChapterTask = prisma.chapter.findUnique({
                where : {
                    id: chapterId,
                },
            });

            const videoDetailsTask =   prisma.video.findUnique({
                where : {
                    id,
                },
                select : {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    duration: true,
                    chapter : {
                        select : {
                            id: true,
                            number: true,
                            title: true,
                            isPremium: true,
                            course : {
                                select : {
                                    id : true,
                                    code : true,
                                    title : true,
                                    price : true,
                                    level : true,
                                    isPremium : true,
                                }
                            }
                        }
                    }
                }
            });

            const [checkCourse,
                checkChapter,
                videoDetails] = await Promise.all([checkCourseTask,checkChapterTask,videoDetailsTask]);

            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!checkChapter)  throw new NotFoundError('Chapter dengan id tersebut tidak ada');
    

            if (!videoDetails) throw new NotFoundError('Video dengan ID tersebut tidak ditemukan');
            if (videoDetails.chapter.id !== chapterId) throw new BadRequestError('Video dengan id tersebut bukan berasal dari chapter ini');
            if (videoDetails.chapter.course.id !== courseId) throw new BadRequestError('Video dengan id tersebut bukan berasal dari courser ini');
      

            /// cek apakah user boleh mengakses ini
            if (checkChapter.isPremium) {
                const userEnrollment = await prisma.enrollment.findMany({
                    where : {
                        authorId : userId,
                        courseId : courseId
                    }
                });

                if (userEnrollment.length < 1) throw new CourseNotPurchasedError('Anda harus daftar kelas ini untuk mengkases ini');
            }


            res.status(200).json({
                success: true,
                data: videoDetails,
            });

        } catch (err) {
            next(err);
        }
    },

    updateVideo: async (req, res, next) => {
        try {
            let { title, description, url, duration,number } = req.body;
            let { courseId, chapterId, id } = req.params;

            if (!title || !description || !url || !duration) throw new BadRequestError('Harap isi semua kolom');
            if (isNaN(Number(duration))) throw new BadRequestError('Duration harus berupa Angka');
            if (isNaN(Number(number))) throw new BadRequestError('Number harus berupa Angka');
            if (!id) throw new BadRequestError('Video ID harus diisi');
            if (isNaN(Number(id))) throw new BadRequestError('ID Harus Berupa Angka');
            if (!courseId || !chapterId) throw new BadRequestError('Course dan Chapter harus diisi');
            if (isNaN(Number(courseId)) || isNaN(Number(chapterId))) throw new BadRequestError('ID Harus Berupa Angka');

            id = Number(id);
            duration = Number(duration);
            number = Number(number);
            courseId = Number(courseId);
            chapterId = Number(chapterId);


            let checkCourse =  prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

          

            let checkChapter =  prisma.chapter.findUnique({
                where: {
                    id: chapterId,
                },
            });
    
    
            
            let checkVideo =  prisma.video.findUnique({
                where: {
                    id: id,
                },
                select: {
                    id: true,
                    number : true,
                    title: true,
                    description: true,
                    url: true,
                    duration: true,
                    chapter: {
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            isPremium: true,
                            course : {
                                select : {
                                    id : true,
                                    code : true,
                                    title : true,
                                    price : true,
                                    level : true,
                                    isPremium : true,
                                }
                            }
                        },
                    },
                },
            });

            [checkCourse,checkChapter,checkVideo] = await Promise.all([checkCourse,checkChapter,checkVideo]);

            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!checkChapter)  throw new NotFoundError('Chapter dengan id tersebut tidak ada');

            if (!checkVideo) throw new NotFoundError('Video dengan id tersebut tidak ada');
            if (checkVideo.chapter.id !== chapterId) throw new BadRequestError('Video dengan id tersebut bukan berasal dari chapter ini');
            if (checkVideo.chapter.course.id !== courseId) throw new BadRequestError('Video dengan id tersebut bukan berasal dari courser ini');

            // validasi number apabila sudah digunakan
            const checkVideoNumber = await prisma.video.findMany({
                where: {
                    number,
                    chapterId
                },
            });

            if (checkVideoNumber.length > 0 && number !== checkVideo.number) throw new BadRequestError('Video dengan nomor tersebut sudah digunakan di chapter ini');    


            const updatedVideo = await prisma.video.update({
                where: {
                    id: id,
                },
                data: {
                    title,
                    description,
                    url,
                    duration,
                    number
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    duration: true,
                    chapter: {
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            isPremium: true,
                        },
                    },
                },
            });

            res.status(200).json({
                success: true,
                message: 'Berhasil memperbarui video',
                data: updatedVideo,
            });
        } catch (err) {
            next(err);
        }
    },

    deleteVideo: async (req, res, next) => {
        try {
            let { courseId, chapterId, id } = req.params;

            if (!id) throw new BadRequestError('Video ID harus diisi');
            if (isNaN(Number(id))) throw new BadRequestError('ID Harus Berupa Angka');
            if (!courseId || !chapterId) throw new BadRequestError('Course dan Chapter harus diisi');
            if (isNaN(Number(courseId)) || isNaN(Number(chapterId))) throw new BadRequestError('ID Harus Berupa Angka');
          
            id = Number(id);
            courseId = Number(courseId);
            chapterId = Number(chapterId);

            let checkCourse = prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

          

            let checkChapter = prisma.chapter.findUnique({
                where: {
                    id: chapterId,
                },
            });
    
    

    
            let checkVideo = prisma.video.findUnique({
                where: {
                    id: id,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    duration: true,
                    chapter: {
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            isPremium: true,
                            course : {
                                select : {
                                    id : true,
                                    code : true,
                                    title : true,
                                    price : true,
                                    level : true,
                                    isPremium : true,
                                }
                            }
                        },
                    },
                },
            });

            [checkCourse,checkChapter,checkVideo] = await Promise.all([checkCourse,checkChapter,checkVideo]);

            
            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!checkChapter)  throw new NotFoundError('Chapter dengan id tersebut tidak ada');

            if (!checkVideo) throw new NotFoundError('Video dengan ID tersebut tidak ditemukan');
            if (checkVideo.chapter.id !== chapterId) throw new BadRequestError('Video dengan id tersebut bukan berasal dari chapter ini');
            if (checkVideo.chapter.course.id !== courseId) throw new BadRequestError('Video dengan id tersebut bukan berasal dari courser ini');

    
            const deletedVideo = await prisma.video.delete({
                where: {
                    id: id,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    duration: true,
                    chapter: {
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            isPremium: true,
                        },
                    },
                },
            });
    
            res.status(200).json({
                success: true,
                message: 'Berhasil menghapus video',
                data: deletedVideo,
            });
        } catch (err) {
            next(err);
        }
    }
};