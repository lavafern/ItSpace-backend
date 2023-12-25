const { prisma } = require('../libs/prismaClient');
const { BadRequestError,NotFoundError } = require('../errors/customErrors');
const { sumDurationChapter } = require('../utils/sumDuration');

module.exports = {

    createChapter: async (req, res, next) => {
        try {
            let { courseId } = req.params;

            if (!courseId) throw new BadRequestError('Tolong isi courseId');
            let { title, number, isPremium } = req.body;
            if (!title || !number) throw new BadRequestError('Harap isi semua kolom');
            if (!(isPremium == '1' || isPremium == '0')) throw new BadRequestError('isPremium harus 1 / 0');

            courseId = Number(courseId);
            number = Number(number);
            isPremium = isPremium == '1' ? true : false; 

            //validasi courseId harus berupa angka
            if (!Number.isInteger(courseId)) throw new BadRequestError('Course ID harus berupa angka') ;

            //validasi number harus Int
            if (!Number.isInteger(number)) throw new BadRequestError('Number chapter harus berupa angka');

            // Cek apakah course dengan id tersebut ada
            const checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');

            // validasi number apabila sudah digunakan
            const checkChapter = await prisma.chapter.findMany({
                where: {
                    number,
                    courseId,
                },
            });

            if (checkChapter.length > 0) throw new BadRequestError('Chapter dengan nomor tersebut sudah digunakan');    

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
                message: 'Berhasil membuat chapter baru',
                data: newChapter,
            });
        } catch (err) {
            next(err);
        }
    },

    getChapter: async (req, res, next) => {
        try {
            let { courseId, id } = req.params;

            if (!courseId || !id) throw new BadRequestError('CourseId dan id tidak boleh kosong');

            courseId = Number(courseId);
            id = Number(id);

            if (!Number.isInteger(courseId) || !Number.isInteger(id)) throw new BadRequestError('Course ID dan Chapter ID harus berupa angka');

            let checkCourse = prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });


            // Ambil chapter berdasarkan courseId dan id
            let chapter = prisma.chapter.findUnique({
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

            //run query concurrently
            [checkCourse,chapter] = await Promise.all([checkCourse,chapter]);

            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!chapter) throw new NotFoundError('Chapter dengan id tersebut tidak ada'); 
            if (chapter.course.id !== checkCourse.id) throw new BadRequestError('Chapter ini bukan berasal dari course ini'); 

            res.status(200).json({
                success: true,
                message: 'Berhasil mendapatkan chapter',
                data: chapter,
            });

        } catch (err) {
            next(err);
        }
    },

    getAllChaptersForCourse: async (req, res, next) => {
        try {
            // masukan userid -1 jika tidak login sebagai user
            let userId = req.user.id;
            let { courseId } = req.params;

            if (!courseId ) throw new BadRequestError('CourseId tidak boleh kosong');

            if (isNaN(Number(courseId))) throw new BadRequestError('Course ID harus berupa angka');

            courseId = Number(courseId);

            let checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                }
            });

            let chapters = await prisma.chapter.findMany({
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
                            number : true,
                            _count : {
                                select : {
                                    progress : {
                                        where : {
                                            authorId :userId
                                        }
                                    }
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
                            isPremium : true
                        }
                    }
                }
            });

            [checkCourse,chapters] = await Promise.all([checkCourse,chapters]);

            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');

            //summarizing duration of each chapters
            const chapterIds = chapters.map(chapter => {
                return {chapterId : chapter.id };
            });

            const sumDurationByChapter = await sumDurationChapter(chapterIds);

            chapters = chapters.map(chapter => {
                sumDurationByChapter.forEach(duration => {
                    if (duration.chapterId === chapter.id) {
                        chapter.duration = duration._sum.duration;
                    }
                });

                chapter.duration = chapter.duration ? chapter.duration : null;
                return chapter;
            });

            res.status(200).json({
                success: true,
                message: 'Berhasil mendapatkan daftar chapters',
                data: chapters,
            });
        } catch (err) {
            next(err);
        }
    },

    updateChapter: async (req, res, next) => {
        try {
            let { courseId, id } = req.params;
            let { title, isPremium, number } = req.body;

            if (isNaN(courseId) || isNaN(id)) throw new BadRequestError('Course ID dan Chapter ID harus berupa angka');
            if (!title || !isPremium || !number) throw new BadRequestError('isi semua kolom');
            if (isNaN(Number(number))) throw new BadRequestError('number harus berupa angka');
            if (!(isPremium == '1' || isPremium == '0')) throw new BadRequestError('isPremium harus 1 / 0');

            isPremium = isPremium == '1' ? true : false;
            number = Number(number);
            courseId = Number(courseId);
            id = Number(id);

            // Cek apakah course dengan id tersebut ada
            let checkCourse = await prisma.course.findUnique({
                where: {
                    id: courseId,
                }
            });

            // Cek apakah chapter dengan id tersebut ada di dalam course
            let checkChapter = await prisma.chapter.findUnique({
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

            // validasi number apabila sudah digunakan
            let checkChapterNumber = prisma.chapter.findMany({
                where: {
                    number,
                    courseId,
                },
            });


            //run query concurrently
            [checkCourse,checkChapter,checkChapterNumber] = await Promise.all([checkCourse,checkChapter,checkChapterNumber]);

            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!checkChapter) throw new NotFoundError('Chapter dengan id tersebut tidak ada');
            if (checkChapter.course.id !== courseId) throw new BadRequestError('Chapter dengan id tersebut berasal dari course yang berbeda');
            if (checkChapterNumber.length > 0 && checkChapter.number !== number) throw new BadRequestError('Chapter dengan nomor tersebut sudah digunakan');
            

            // Update chapter berdasarkan chapterId
            let updatedChapter = await prisma.chapter.update({
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
                message: 'Berhasil update chapter',
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

            if (isNaN(courseId) || isNaN(id)) throw new BadRequestError('Course ID dan Chapter ID harus berupa angka');
          

            let checkCourse = prisma.course.findUnique({
                where: {
                    id: courseId,
                },
            });

            let checkChapter = prisma.chapter.findUnique({
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

            //run query concurrently
            [checkCourse,checkChapter] = await Promise.all([checkCourse,checkChapter]);


            if (!checkCourse) throw new NotFoundError('Course dengan id tersebut tidak ada');
            if (!checkChapter) throw new NotFoundError('Chapter dengan id tersebut tidak ada');
            if (checkChapter.course.id !== courseId) throw new BadRequestError('Chapter dengan id tersebut berasal dari course yang berbeda');
            
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
                message: 'Berhasil menghapus chapter',
                data : deletedChapter
            });
        } catch (err) {
            next(err);
        }
    }
};