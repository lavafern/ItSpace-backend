const { prisma } = require("../utils/prismaClient");
const {
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} = require("../errors/customErrors");

module.exports = {
  createChapter: async (req, res, next) => {
    try {
      //const role = req.user.profile.role
      //if (role !== "ADMIN") throw new ForbiddenError("Kamu tidak memiliki akses kesini")

      let { title, number, isPremium } = req.body;
      if (!title || !number) throw new BadRequestError("Harap isi semua kolom");
      if (!(isPremium === false || isPremium === true))
        throw new BadRequestError("isPremium harus boolean");
      let { courseId } = req.params;
      courseId = Number(courseId);
      number = Number(number);

      //validasi courseId harus berupa angka
      if (!Number.isInteger(courseId)) {
        throw new BadRequestError("Course ID harus berupa angka");
      }

      //validasi number harus Int
      if (!Number.isInteger(number)) {
        throw new BadRequestError("Number chapter harus berupa angka");
      }

      // Cek apakah course dengan id tersebut ada
      const checkCourse = await prisma.course.findUnique({
        where: {
          id: courseId,
        },
      });
      if (!checkCourse)
        throw new NotFoundError("Course dengan id tersebut tidak ada");

      // validasi number apabila sudah digunakan
      const checkChapter = await prisma.chapter.findMany({
        where: {
          number,
          courseId,
        },
      });
      if (checkChapter.length > 1)
        throw new BadRequestError(
          "Chapter dengan nomor tersebut sudah digunakan"
        );

      // Buat chapter baru
      const newChapter = await prisma.chapter.create({
        data: {
          title,
          number,
          isPremium,
          courseId,
        },
      });

      res.status(201).json({
        success: true,
        message: "Berhasil membuat chapter baru",
        data: newChapter,
      });
    } catch (err) {
      next(err);
    }
  },

  getChapter: async (req, res, next) => {
    try {
      let { courseId, chapterId } = req.params;
      courseId = Number(courseId);
      chapterId = Number(chapterId);

      if (!Number.isInteger(courseId) || !Number.isInteger(chapterId)) {
        throw new BadRequestError(
          "Course ID dan Chapter ID harus berupa angka"
        );
      }

      const checkCourse = await prisma.course.findUnique({
        where: {
          id: courseId,
        },
      });

      if (!checkCourse)
        throw new NotFoundError("Course dengan id tersebut tidak ada");

      // Ambil chapter berdasarkan courseId dan chapterId
      const chapter = await prisma.chapter.findUnique({
        where: {
          id: chapterId,
        },
      });

      if (!chapter)
        throw new NotFoundError("Chapter dengan id tersebut tidak ada");

      res.status(200).json({
        success: true,
        message: "Berhasil mendapatkan chapter",
        data: chapter,
      });
    } catch (err) {
      next(err);
    }
  },

   updateChapter: async (req, res, next) => {
    try {
      let { courseId, id } = req.params;
      console.log (id)
      courseId = Number(courseId);
      id = Number(id);

      // Validasi courseId dan chapterId harus berupa angka
      if (isNaN(courseId) || isNaN(id)) {
        throw new BadRequestError("Course ID dan Chapter ID harus berupa angka");
      }

      // Cek apakah course dengan id tersebut ada
      const checkCourse = await prisma.course.findUnique({
        where: {
          id: courseId,
        },
      });
      if (!checkCourse) throw new NotFoundError("Course dengan id tersebut tidak ada");

      // Cek apakah chapter dengan id tersebut ada di dalam course
      const checkChapter = await prisma.chapter.findUnique({
        where: {
          id,
        },
      });
      if (!checkChapter || checkChapter.courseId !== courseId) {
        throw new NotFoundError("Chapter dengan id tersebut tidak ada di dalam course");
      }

      // Dapatkan data update dari body request
      const { title, isPremium } = req.body;

      // Update chapter berdasarkan chapterId
      const updatedChapter = await prisma.chapter.update({
        where: {
          id,
        },
        data: {
          title: title || checkChapter.title,
          isPremium: isPremium !== undefined ? isPremium : checkChapter.isPremium,
        },
      });

      res.status(200).json({
        success: true,
        message: "Berhasil update chapter",
        data: updatedChapter,
      });
    } catch (err) {
      next(err);
    }
  },
    deleteChapter: async (req, res, next) => {
        try {
          let { courseId, id } = req.params;
          courseId = Number(courseId);
          id = Number(id);

          if (isNaN(courseId) || isNaN(id)) {
            throw new BadRequestError("Course ID dan Chapter ID harus berupa angka");
          }

          const checkCourse = await prisma.course.findUnique({
            where: {
              id: courseId,
            },
          });
          if (!checkCourse) throw new NotFoundError("Course dengan id tersebut tidak ada");

          const checkChapter = await prisma.chapter.findUnique({
            where: {
              id,
            },
          });
          if (!checkChapter || checkChapter.courseId !== courseId) {
            throw new NotFoundError("Chapter dengan id tersebut tidak ada di dalam course");
          }

          await prisma.chapter.delete({
            where: {
              id,
            },
          });

          res.status(200).json({
            success: true,
            message: "Berhasil menghapus chapter",
          });
        } catch (err) {
          next(err);
        }
      },
};

  getAllChaptersForCourse: async (req, res, next) => {
    try {
      let { courseId } = req.params;
      courseId = Number(courseId);

      if (!Number.isInteger(courseId)) {
        throw new BadRequestError("Course ID harus berupa angka");
      }

      const checkCourse = await prisma.course.findUnique({
        where: {
          id: courseId,
        },
      });

      if (!checkCourse)
        throw new NotFoundError("Course dengan id tersebut tidak ada");

      const chapters = await prisma.chapter.findMany({
        where: {
          courseId,
        },
      });

      res.status(200).json({
        success: true,
        message: "Berhasil mendapatkan daftar chapters",
        data: chapters,
      });
    } catch (err) {
      next(err);
    }
  };

