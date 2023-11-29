const { prisma } = require("../utils/prismaClient");

module.exports = {
  createChapter : async (req, res, next) => {
  try {
    // TODO: Implement authorization

    const { title, number, isPremium } = req.body;

    const { courseId } = req.params;

    // Validasi input
    if (!title || !number || !(isPremium === false || isPremium === true)) {
        throw new Error("Silakan isi semua kolom yang diperlukan", { cause: 404 });
    }

    // Check apakah chapter dengan nomor tersebut sudah ada untuk course tertentu
    const checkCourse= await prisma.course.findUnique({
      where: {
        id : courseId
      },
    });

    if (checkCourse) {
      throw new Error("Chapter dengan nomor tersebut sudah ada", { cause: 400 });
    }

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
}
};