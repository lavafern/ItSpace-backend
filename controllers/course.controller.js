const {prisma} = require("../utils/prismaClient")
const {ForbiddenError,BadRequestError, NotFoundError, InternalServerError} = require("../errors/customErrors")
const imagekit = require("../utils/imagekit")
const path = require("path")
const {getAllCourseFilter} = require("../utils/searchFilters")
const getPagination = require("../utils/pagination")

module.exports = {
    createCourse : async (req,res,next) => {
        try {
            const role = req.user.profile.role

            
            if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini")

            let thumbnailUrl = !(req.file) ? "https://ik.imagekit.io/itspace/download.jpeg?updatedAt=1701289170908" : (await imagekit.upload({
                fileName: + Date.now() + path.extname(req.file.originalname),
                file: req.file.buffer.toString('base64')
            })).url

            let {
                title,price,level,isPremium,description,courseCategory ,mentorEmail,code,groupUrl
            } = req.body
            console.log(req.body);

            price = Number(price)
            if (isNaN(price)) throw new BadRequestError("Kolom harga harus diisi dengan angka")
            if (!title || !price || !level  || !description || !code || !groupUrl || !mentorEmail || !courseCategory) throw new BadRequestError("Tolong isi semua kolom")
            if (!(Array.isArray(courseCategory)) || !(Array.isArray(mentorEmail)) ) throw new BadRequestError("category dan email mentor harus array")
            if (!(isPremium === false || isPremium === true)) throw new BadRequestError("isPremium harus boolean")
            if (!(level === "BEGINNER" || level === "INTERMEDIATE" || level === "ADVANCED")) throw new BadRequestError("level tidak valid")
            if (description.length > 1024)  throw new BadRequestError("Deskripsi harus tidak lebih dari 1024 karakter")
            if (title.length > 60) throw new BadRequestError("Judul tidak boleh lebih dari 60 karakter")


            //check if code is exist 
            checkCode = await prisma.course.findUnique({
                where : {
                    code
                }
            })
            if (checkCode) throw new BadRequestError("Gunakan kode lain")

            
            // category data
            const courseCategoryForPrisma = courseCategory.map((c) => {
                return {name : c}
            })

            let categoryId = await prisma.category.findMany({
                where : {
                    OR : courseCategoryForPrisma
                }
            })

            const validCategory = categoryId.map((i) => {
                return i.name
            })
            categoryId = categoryId.map((i) => {
                return {categoryId : i.id}
            })



            // mentor data
            const mentorEmailForPrisma = mentorEmail.map((e) => {
                return {email : e}
            })

            let mentorId = await prisma.user.findMany({
                where : {
                    OR : mentorEmailForPrisma
                }
            })
            const mentorValidEmail = mentorId.map((i) => {
                return i.email
            })

            mentorId = mentorId.map((i) => {
                return {authorId : i.id}
            })


            
            // create new course
            const newCourse = await prisma.course.create({
                data : {
                    code,
                    title,
                    price,
                    level,
                    isPremium,
                    description,
                    groupUrl,
                    thumbnailUrl,
                    courseCategory : {
                        create : categoryId
                    },
                    mentor : {
                        create : mentorId
                    }
                    
                }
                
            })

            newCourse.mentor = mentorValidEmail
            newCourse.category = validCategory
            

            res.status(201).json({
                success : true,
                message : "succesfully create new course",
                data : newCourse
            })

        } catch (err) {
            next(err)
        }
    },

    getAllCourse : async (req,res,next) => {
      try {
        let {category,level,ispremium,page,limit,se} = req.query
        page = page ? Number(page) : 1
        limit = limit ? Number(limit) : 10
        console.log(category);

        const filters = getAllCourseFilter(ispremium,level,category)
        let coursesCount = await prisma.course.findMany({
            orderBy : [
                { id : 'asc'}
            ]
        ,
          where : {
             title : {
                contains : se,
                mode : 'insensitive'
            },
            AND : filters
          },
          include : {
            courseCategory : {
                select : {
                    category : {
                        select : {
                            name : true
                        }
                    }
                }
                
            },
            mentor : {
                select : { 
                    author : {
                        select :{
                            profile : {
                                select : {
                                    name : true
                                }
                            }
                        }
                    }
                }
            },
          }
        })

        coursesCount = coursesCount.length

        const courses = await prisma.course.findMany({
            skip : (page - 1) * limit,
            take : limit,
            // TODO : buat sorting berdasarkan banyak popularity (enroll)
            orderBy : [
                { id : 'asc'}
            ]
        ,
          where : {
            title : {
                contains : se,
                mode : 'insensitive'
            },
            AND : filters
          },
          include : {
            courseCategory : {
                select : {
                    category : {
                        select : {
                            name : true
                        }
                    }
                }
                
            },
            mentor : {
                select : { 
                    author : {
                        select :{
                            profile : {
                                select : {
                                    name : true
                                }
                            }
                        }
                    }
                }
            },
          }
        })

        const pagination = getPagination(req,coursesCount,page,limit,category,level,ispremium)

        const result = {
            pagination,
            courses
        }
        return res.status(200).json({
            success : true,
            message : "Sucessfully get all course",
            data : result
        })

      } catch (err) {
        next(err)
      }
    },

    getCourseDetail : async (req,res,next) => {
        try {
            let {id} = req.params

            if (!id) throw new BadRequestError("Id tidak valid")
            if (isNaN(Number(id))) throw new BadRequestError("Id tidak valid")

            id = Number(id)
            // TODO : add chapters, videos, rating, progress etc.
            const courseDetail = await prisma.course.findUnique({
                where : {
                    id
                },
                include : {
                    mentor : {
                        select : {
                            author : {
                                select : {
                                    profile : {
                                        select : {
                                            name : true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    courseCategory : {
                        select : {
                            category : {
                                select : {
                                    name : true
                                }
                            }
                        }
                    }
                }
            })

            if (!courseDetail) throw new NotFoundError("Course tidak ditemukan")

            res.status(200).json({
                success : true,
                message : "succesfully view course detail",
                data : courseDetail
            })
            
        } catch (err) {
            next(err)
        }
    },

    updateCourse: async (req, res, next) => {
        try {
            const role = req.user.profile.role
            if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini")

            
            let courseId = req.params.id;
            let {
                code, title, price, level, isPremium, description, courseCategory, mentorEmail,groupUrl
            } = req.body;
            console.log(req.body);
            price = Number(price);
            courseId = Number(courseId);

            if (isNaN(courseId)) throw new BadRequestError("Id harus diisi dengan angka")
            if (isNaN(price)) throw new BadRequestError("Kolom harga harus diisi dengan angka")
            if (!title || !price || !level  || !description || !code || !groupUrl || !mentorEmail || !courseCategory) throw new BadRequestError("Tolong isi semua kolom")
            if (!(Array.isArray(courseCategory)) || !(Array.isArray(mentorEmail)) ) throw new BadRequestError("category dan email mentor harus array")
            if (!(isPremium === false || isPremium === true)) throw new BadRequestError("isPremium harus boolean")
            if (!(level === "BEGINNER" || level === "INTERMEDIATE" || level === "ADVANCED")) throw new BadRequestError("level tidak valid")
            if (description.length > 1024)  throw new BadRequestError("Deskripsi harus tidak lebih dari 1024 karakter")
            if (title.length > 60) throw new BadRequestError("Judul tidak boleh lebih dari 60 karakter")

            //check course is exist
            const checkCourse = await prisma.course.findUnique({
                where : {
                    id : courseId
                }
            })

            let thumbnailUrl = !(req.file) ? checkCourse.thumbnailUrl : (await imagekit.upload({
                fileName: + Date.now() + path.extname(req.file.originalname),
                file: req.file.buffer.toString('base64')
            })).url

            if (!checkCourse)throw new NotFoundError("Course tidak ditemukan")

            // category data
            const courseCategoryForPrisma = courseCategory.map((c) => {
                return { name: c };
            });

            let categoryId = await prisma.category.findMany({
                where: {
                    OR: courseCategoryForPrisma,
                },
            });

            const validCategory = categoryId.map((i) => {
                return i.name;
            });
            categoryId = categoryId.map((i) => {
                return { categoryId: i.id };
            });

            // mentor data
            const mentorEmailForPrisma = mentorEmail.map((e) => {
                return { email: e };
            });

            let mentorId = await prisma.user.findMany({
                where: {
                    OR: mentorEmailForPrisma,
                },
            });
            const mentorValidEmail = mentorId.map((i) => {
                return i.email;
            });

            mentorId = mentorId.map((i) => {
                return { authorId: i.id };
            });
            //delete category
            await prisma.courseCategory.deleteMany({
                 where: {
                    courseId: courseId
                }
            })
             //delete mentor
            await prisma.mentor.deleteMany({
                where: {
                   courseId: courseId
               }
            })

            // update course
            const updatedCourse = await prisma.course.update({
                where: {
                    id: courseId,
                },
                data: {
                    title,
                    price,
                    level,
                    isPremium,
                    description,
                    groupUrl,
                    thumbnailUrl,
                    courseCategory : {
                        create : categoryId
                    },
                    mentor : {
                        create : mentorId
                    }

                },
            });

            updatedCourse.mentor = mentorValidEmail;
            updatedCourse.category = validCategory;

            res.status(201).json({
                success: true,
                message: "Successfully update course",
                data: updatedCourse,
            });
        } catch (err) {
            next(err);
        }
    },
    
    deleteCourse: async (req, res, next) => {
        try {
            const role = req.user.profile.role
            if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini")
            
            let { id } = req.params
            if (!id) throw new BadRequestError("Id tidak boleh kosong")

            id = Number(id)
            if (isNaN(id)) throw new BadRequestError("Id harus angka")

            //check course is exist
            const checkCourse = await prisma.course.findUnique({
                where : {
                    id 
                }
            })
            if (!checkCourse)throw new NotFoundError("Course tidak ditemukan")


            let deleteCourse = await prisma.course.delete({
                where: { 
                    id
                 }
            });

            res.status(200).json({
                status: true,
                message: 'Successfully delete course',
                data: deleteCourse
            });

        } catch (err) {
            next(err);
        }
    },

};

