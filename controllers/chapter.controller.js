const { prisma } = require("../utils/prismaClient");
const {ForbiddenError,BadRequestError, NotFoundError} = require("../errors/customErrors")


module.exports = {
  createChapter: async (req, res, next) => {
    try {
      //const role = req.user.profile.role
      //if (role !== "ADMIN") throw new ForbiddenError("Kamu tidak memiliki akses kesini")

      let {
        title,
        number,
        isPremium
      } = req.body
      if (!title || !number) throw new BadRequestError("Harap isi semua kolom")
      if (!(isPremium === false || isPremium === true)) throw new BadRequestError("isPremium harus boolean")
      let {courseId} = req.params;
       courseId = Number(courseId);
       number = Number(number);

       //validasi courseId harus berupa angka
       if(!Number.isInteger(courseId)) {
        throw new BadRequestError("Course ID harus berupa angka")
       }

       //validasi number harus Int
      if (!Number.isInteger(number)) {
        throw new BadRequestError("Number chapter harus berupa angka")
      }
      
      // Cek apakah course dengan id tersebut ada
      const checkCourse = await prisma.course.findUnique({
        where: {
          id: courseId,
        },
      })
      if (!checkCourse) throw new NotFoundError("Course dengan id tersebut tidak ada")


      // validasi number apabila sudah digunakan
      const checkChapter = await prisma.chapter.findMany({
        where:{
          number,
          courseId,
        },
      })
      if (checkChapter.length > 1) throw new BadRequestError("Chapter dengan nomor tersebut sudah digunakan");

      // Buat chapter baru
      const newChapter = await prisma.chapter.create({
        data: {
          title,
          number,
          isPremium,
          courseId,
        },
      })

      res.status(201).json({
        success: true,
        message: "Berhasil membuat chapter baru",
        data: newChapter,
      })
    } catch (err) {
      next(err)
    }
  },
}
