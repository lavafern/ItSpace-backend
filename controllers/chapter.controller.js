const { prisma } = require("../utils/prismaClient");
const { ForbiddenError,BadRequestError,NotFoundError } = require("../errors/customErrors");

module.exports = {

    createChapter: async (req, res, next) => {
        try {

            const role = req.user.profile.role
            let { courseId } = req.params;

            if (!courseId) throw new BadRequestError("Tolong isi courseId")
            if (role !== "ADMIN") throw new ForbiddenError("Kamu tidak memiliki akses kesini")  
            let { title, number, isPremium } = req.body;
            if (!title || !number) throw new BadRequestError("Harap isi semua kolom");
            if (!(isPremium == '1' || isPremium == '0')) throw new BadRequestError("isPremium harus 1 / 0");

            courseId = Number(courseId);
            number = Number(number);
            isPremium = isPremium == '1' ? true : false 

            //validasi courseId harus berupa angka
            if (!Number.isInteger(courseId)) throw new BadRequestError("Course ID harus berupa angka") 

            //validasi number harus Int
            if (!Number.isInteger(number)) throw new BadRequestError("Number chapter harus berupa angka")

            // Cek apakah course dengan id tersebut ada
            const checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

            if (!checkCourse) throw new NotFoundError("Course dengan id tersebut tidak ada");

            // validasi number apabila sudah digunakan
            const checkChapter = await prisma.chapter.findMany({
                where: {
                    number,
                    courseId,
                },
            });

            if (checkChapter.length > 0) throw new BadRequestError("Chapter dengan nomor tersebut sudah digunakan");    

            // Buat chapter baru
            const newChapter = await prisma.chapter.create({
                data: {
                    title,
                    number,
                    isPremium,
                    courseId,
                },
                select : {
                    id : true,
                    title : true,
                    number : true,
                    isPremium : true,
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

            let { courseId, id } = req.params;

            if (!courseId || !id) throw new BadRequestError("CourseId dan id tidak boleh kosong");

            courseId = Number(courseId);
            id = Number(id);

            if (!Number.isInteger(courseId) || !Number.isInteger(id)) throw new BadRequestError("Course ID dan Chapter ID harus berupa angka");

            const checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

          if (!checkCourse) throw new NotFoundError("Course dengan id tersebut tidak ada");

          // Ambil chapter berdasarkan courseId dan id
            const chapter = await prisma.chapter.findUnique({
                where: {
                    id: id,
                },
                select : {
                    id : true,
                    title : true,
                    number : true,
                    isPremium : true,
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
            }); 
            if (!chapter) throw new NotFoundError("Chapter dengan id tersebut tidak ada"); 

            res.status(200).json({
                success: true,
                message: "Berhasil mendapatkan chapter",
                data: chapter,
            });

        } catch (err) {
            next(err);
        }
    },

    getAllChaptersForCourse: async (req, res, next) => {
        try {
            // masukan userid -1 jika tidak login sebagai user
            let userId = req.user.id
            let { courseId } = req.params;

            if (!courseId ) throw new BadRequestError("CourseId tidak boleh kosong");

            if (isNaN(Number(courseId))) throw new BadRequestError("Course ID harus berupa angka");

            courseId = Number(courseId);

            const checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                }
            });

            if (!checkCourse) throw new NotFoundError("Course dengan id tersebut tidak ada");

            const chapters = await prisma.chapter.findMany({
                where: {
                    courseId,
                },
                orderBy : [
                    {number : 'asc'}
                ],
                select : {
                    id : true,
                    title : true,
                    number : true,
                    isPremium : true,
                    video : {
                        select : {
                            id : true,
                            title : true,
                            duration : true,
                            progress : {
                                where : {
                                    authorId : userId
                                },
                                select : {
                                    id : true,
                                    completedDate : true
                                }
                            }
                        }
                    },
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
            });

            res.status(200).json({
                success: true,
                message: "Berhasil mendapatkan daftar chapters",
                data: chapters,
            });

        } catch (err) {
            next(err);
        }
    },

    updateChapter: async (req, res, next) => {
        try {

            const role = req.user.profile.role
            let { courseId, id } = req.params;

            if (role !== "ADMIN") throw new ForbiddenError("Kamu tidak memiliki akses kesini")

            courseId = Number(courseId);
            id = Number(id);

            // Validasi courseId dan chapterId harus berupa angka
            if (isNaN(courseId) || isNaN(id)) throw new BadRequestError("Course ID dan Chapter ID harus berupa angka");
            

            // Cek apakah course dengan id tersebut ada
            const checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                }
            });

            if (!checkCourse) throw new NotFoundError("Course dengan id tersebut tidak ada");

            // Cek apakah chapter dengan id tersebut ada di dalam course
            const checkChapter = await prisma.chapter.findUnique({
                where: {
                      id,
                },
                select : {
                    id : true,
                    title : true,
                    number : true,
                    isPremium : true,
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
            });

            if (!checkChapter) throw new NotFoundError("Chapter dengan id tersebut tidak ada")
            if (checkChapter.course.id !== courseId) throw new BadRequestError("Chapter dengan id tersebut berasal dari course yang berbeda");

            // Dapatkan data update dari body request
            let { title, isPremium, number } = req.body;

            if (!title || !isPremium || !number) throw new BadRequestError("isi semua kolom")
            if (isNaN(Number(number))) throw new BadRequestError("number harus berupa angka")
            number = Number(number)

            if (!(isPremium == '1' || isPremium == '0')) throw new BadRequestError("isPremium harus 1 / 0");

            isPremium = isPremium == '1' ? true : false

            // validasi number apabila sudah digunakan
            const checkChapterNumber = await prisma.chapter.findMany({
                where: {
                    number,
                    courseId,
                },
            });

            if (checkChapterNumber.length > 0 && checkChapter.number !== number) throw new BadRequestError("Chapter dengan nomor tersebut sudah digunakan");


            // Update chapter berdasarkan chapterId
            const updatedChapter = await prisma.chapter.update({
                where: {
                    id,
                },
                data: {
                    title: title ,
                    isPremium: isPremium,
                    number : number
                },
                select : {
                    id : true,
                    title : true,
                    number : true,
                    isPremium : true,
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

            });

            res.status(201).json({
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
            const role = req.user.profile.role
            if (role !== "ADMIN") throw new ForbiddenError("Kamu tidak memiliki akses kesini")

            let { courseId, id } = req.params;



            courseId = Number(courseId);
            id = Number(id);

            if (isNaN(courseId) || isNaN(id)) throw new BadRequestError("Course ID dan Chapter ID harus berupa angka");
          

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
              select : {
                id : true,
                title : true,
                number : true,
                isPremium : true,
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
            });

            if (!checkChapter) throw new NotFoundError("Chapter dengan id tersebut tidak ada");
            if (checkChapter.course.id !== courseId) throw new BadRequestError("Chapter dengan id tersebut berasal dari course yang berbeda");
            
            const deletedChapter = await prisma.chapter.delete({
              where: {
                id,
              },
              select : {
                id : true,
                title : true,
                number : true,
                isPremium : true,
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
            }); 

            res.status(200).json({
                success: true,
                message: "Berhasil menghapus chapter",
                data : deletedChapter
            });
        } catch (err) {
            next(err);
        }
      }
    };