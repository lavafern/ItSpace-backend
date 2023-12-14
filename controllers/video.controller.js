const { prisma } = require("../utils/prismaClient");
const { ForbiddenError, BadRequestError, NotFoundError } = require("../errors/customErrors");

module.exports = {
  createVideo: async (req, res, next) => {
    try {
      //const role = req.user.profile.role;

      //if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini");

      let {title, description, url, duration} = req.body;
      let { courseId, chapterId } = req.params;
      
      
      if (!title || !description || !url || !duration) {
        throw new BadRequestError("Harap isi semua kolom");
      }
      if (isNaN(Number(duration))){
        throw new BadRequestError("Duration harus berupa Angka");
      }

      if (!courseId || !chapterId){
        throw new BadRequestError('Course dan Chapter harus diisi');
      }
      if (isNaN(Number(courseId)) || isNaN(Number(chapterId))){
        throw new BadRequestError("ID Harus Berupa Angka")
      }

      courseId = Number(courseId);
      chapterId = Number(chapterId);

      const checkCourse = await prisma.course.findUnique({
        where: {
          id: courseId,
        },
      });
    if (!checkCourse)
        throw new BadRequestError("Course dengan id tersebut tidak ada");

   // Mengasumsikan ada model video dengan kolom: id, title, description, url, duration
      const checkChapter = await prisma.chapter.findUnique({
        where: {
          id: chapterId,
        },
      });

    if (!checkChapter)
        throw new BadRequestError("Chapter dengan id tersebut tidak ada");

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
      const { videoId } = req.params;

      if (!videoId || isNaN(Number(videoId))) {
        throw new BadRequestError("ID Video harus diisi dan berupa angka");
      }

      const videoDetails = await prisma.video.findUnique({
        where: {
          id: Number(videoId),
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

      if (!videoDetails) {
        throw new NotFoundError("Video dengan ID tersebut tidak ditemukan");
      }

      res.status(200).json({
        success: true,
        data: videoDetails,
      });
    } catch (err) {
      next(err);
    }
  },

};
