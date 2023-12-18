const { prisma } = require("../utils/prismaClient");
const { ForbiddenError, BadRequestError, NotFoundError, CourseNotPurchasedError } = require("../errors/customErrors");

module.exports = {
    createVideo: async (req, res, next) => {
        try {
            const role = req.user.profile.role;
 
            if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini");
 
            let {title, description, url, duration} = req.body;
            let { courseId, chapterId } = req.params;
      
      
            if (!title || !description || !url || !duration) throw new BadRequestError("Harap isi semua kolom");
            if (isNaN(Number(duration))) throw new BadRequestError("Duration harus berupa Angka");
            if (!courseId || !chapterId) throw new BadRequestError('Course dan Chapter harus diisi');
            if (isNaN(Number(courseId)) || isNaN(Number(chapterId))) throw new BadRequestError("ID Harus Berupa Angka")
      

            duration = Number(duration)
            courseId = Number(courseId);
            chapterId = Number(chapterId);

            const checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

            if (!checkCourse)throw new BadRequestError("Course dengan id tersebut tidak ada");

            // Mengasumsikan ada model video dengan kolom: id, title, description, url, duration
            const checkChapter = await prisma.chapter.findUnique({
                where: {
                    id: chapterId,
                },
                include : {
                    course : true
                }
            });

            if (!checkChapter) throw new BadRequestError("Chapter dengan id tersebut tidak ada");
    
            if (checkChapter.course.id !== courseId) throw new BadRequestError("Chapter ini bukan berasal dari course ini")

            const newVideo = await prisma.video.create({
                        data:{
                            title,
                            description,
                            url,
                            duration,
                            chapterId
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

                    res.status(201).json({
                        success: true,
                        message: "Berhasil membuat video baru",
                        data: newVideo,
                    });

        } catch (err) {
            next(err);
        }
    },
  
  getVideoDetails: async (req, res, next) => {
    try {

      const userId = req.user.profile.id;
      
      let { courseId, chapterId, id } = req.params;

      if (!id) {
        throw new BadRequestError("Video ID harus diisi");
      }
      if (isNaN(Number(id))) {
        throw new BadRequestError("ID Harus Berupa Angka");
      }

      if (!courseId || !chapterId){
        throw new BadRequestError('Course dan Chapter harus diisi');
      }

      if (isNaN(Number(courseId)) || isNaN(Number(chapterId))){
        throw new BadRequestError("ID Harus Berupa Angka")
      }

      id = Number(id);
      courseId = Number(courseId);
      chapterId = Number(chapterId);


      
      const checkCourse = await prisma.course.findUnique({
            where: {
              id: courseId,
              },
            });

          if (!checkCourse) throw new BadRequestError("Course dengan id tersebut tidak ada");
          

          const checkChapter = await prisma.chapter.findUnique({
            where: {
              id: chapterId,
            },
          });
    
        if (!checkChapter)  throw new BadRequestError("Chapter dengan id tersebut tidak ada");
    

      

      const videoDetails = await prisma.video.findUnique({
        where: {
          id,
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

      if (!videoDetails) {
        throw new NotFoundError("Video dengan ID tersebut tidak ditemukan");
      }

      if (videoDetails.chapter.id !== chapterId) {
        throw new BadRequestError("Video dengan id tersebut bukan berasal dari chapter ini")
      }

      if (videoDetails.chapter.course.id !== courseId) {
        throw new BadRequestError("Video dengan id tersebut bukan berasal dari courser ini")
      }

      /// cek apakah user boleh mengakses ini
      if (checkChapter.isPremium) {
        const userEnrollment = await prisma.enrollment.findMany({
          where : {
            authorId : userId,
            courseId : courseId
          }
        })

        if (userEnrollment.length < 1) throw new CourseNotPurchasedError("Anda harus daftar kelas ini untuk mengkases ini")
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
          const role = req.user.profile.role;
          if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini");
 
          let { title, description, url, duration } = req.body;
          let { courseId, chapterId, id } = req.params;

          if (!title || !description || !url || !duration) {
            throw new BadRequestError("Harap isi semua kolom");
          }
          if (isNaN(Number(duration))) {
            throw new BadRequestError("Duration harus berupa Angka");
          }

          if (!id) {
            throw new BadRequestError("Video ID harus diisi");
          }
          if (isNaN(Number(id))) {
            throw new BadRequestError("ID Harus Berupa Angka");
          }

          if (!courseId || !chapterId){
            throw new BadRequestError('Course dan Chapter harus diisi');
          }

          if (isNaN(Number(courseId)) || isNaN(Number(chapterId))){
            throw new BadRequestError("ID Harus Berupa Angka")
          }

          id = Number(id);
          duration = Number(duration);
          courseId = Number(courseId);
          chapterId = Number(chapterId);


          const checkCourse = await prisma.course.findUnique({
            where: {
              id: courseId,
              },
            });

          if (!checkCourse) throw new BadRequestError("Course dengan id tersebut tidak ada");
          

          const checkChapter = await prisma.chapter.findUnique({
            where: {
              id: chapterId,
            },
          });
    
        if (!checkChapter)  throw new BadRequestError("Chapter dengan id tersebut tidak ada");
    

          const checkVideo = await prisma.video.findUnique({
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

          if (!checkVideo) {
            throw new NotFoundError("Video dengan id tersebut tidak ada");
          }

          if (checkVideo.chapter.id !== chapterId) {
            throw new BadRequestError("Video dengan id tersebut bukan berasal dari chapter ini")
          }

          if (checkVideo.chapter.course.id !== courseId) {
            throw new BadRequestError("Video dengan id tersebut bukan berasal dari courser ini")
          }

          const updatedVideo = await prisma.video.update({
            where: {
              id: id,
            },
            data: {
              title,
              description,
              url,
              duration,
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
            message: "Berhasil memperbarui video",
            data: updatedVideo,
          });
        } catch (err) {
          next(err);
        }
      },

  deleteVideo: async (req, res, next) => {
    try {
          const role = req.user.profile.role;
          if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini");
 
          let { courseId, chapterId, id } = req.params;

          if (!id) {
            throw new BadRequestError("Video ID harus diisi");
          }

          if (isNaN(Number(id))) {
            throw new BadRequestError("ID Harus Berupa Angka");
          }

          if (!courseId || !chapterId){
            throw new BadRequestError('Course dan Chapter harus diisi');
          }

          if (isNaN(Number(courseId)) || isNaN(Number(chapterId))){
            throw new BadRequestError("ID Harus Berupa Angka")
          }


          id = Number(id);
          courseId = Number(courseId);
          chapterId = Number(chapterId);

          const checkCourse = await prisma.course.findUnique({
            where: {
              id: courseId,
              },
            });

          if (!checkCourse) throw new BadRequestError("Course dengan id tersebut tidak ada");
          

          const checkChapter = await prisma.chapter.findUnique({
            where: {
              id: chapterId,
            },
          });
    
        if (!checkChapter)  throw new BadRequestError("Chapter dengan id tersebut tidak ada");
    

    
          const checkVideo = await prisma.video.findUnique({
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
    
          if (!checkVideo) {
            throw new NotFoundError("Video dengan ID tersebut tidak ditemukan");
          }

          if (checkVideo.chapter.id !== chapterId) {
            throw new BadRequestError("Video dengan id tersebut bukan berasal dari chapter ini")
          }

          if (checkVideo.chapter.course.id !== courseId) {
            throw new BadRequestError("Video dengan id tersebut bukan berasal dari courser ini")
          }

    
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
            message: "Berhasil menghapus video",
            data: deletedVideo,
          });
        } catch (err) {
          next(err);
        }
      },
};