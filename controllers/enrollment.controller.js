const { BadRequestError, CourseNotPurchasedError,UserNotVerifiedError } = require("../errors/customErrors")
const { prisma } = require("../utils/prismaClient")
const {getAllCourseFilter} = require("../utils/searchFilters")
const getPagination = require("../utils/pagination")

module.exports = {
    createEnrollment : async (req,res,next) => {
        try {

            const userid = req.user.id

            let {courseId} = req.body
            courseId = Number(courseId)

            if (!courseId) throw new BadRequestError("Tolong masukan courseId")

             // checks if user is verified
             const user = await prisma.user.findUnique({
                where : {
                    id : userid
                }
            })
            if (!(user.verified)) throw new UserNotVerifiedError("Akun belum di verifikasi")

            // checks if course exist
            const checkCourse = await prisma.course.findUnique({
                where : {
                    id : courseId
                }
            })

            if (!checkCourse) throw new BadRequestError("CourseId tidak valid")

            // checks if enrollment already exist
            const checkEnrollment = await prisma.enrollment.findMany({
                where : {
                    courseId : courseId,
                    authorId : userid
                }
            })

            if (checkEnrollment.length > 0)  throw new BadRequestError("Anda telah mendaftar di course ini")

            // chekcs if enrollment premium
            if (checkCourse.isPremium) throw new CourseNotPurchasedError("Anda harus membeli course premium")

            
            // insert enrollment data
            const enrollment = prisma.enrollment.create({
                data : {
                    courseId : courseId,
                    authorId : userid,
                    date : new Date()
                },
                select : {
                    id : true,
                    date : true,
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
            })

            const pushNotification = prisma.notification.create({
                data : {
                    authorId: userid,
                    type : "Pendaftaran kelas berhasil",
                    message : `Terima kasih telah melakukan pendaftaran, kelas ${checkCourse.title} sudah bisa kamu akses.`,
                    created_at : new Date(),
                    is_read : false
                }
            })

            const enrollAndNotif = await prisma.$transaction([enrollment,pushNotification])

            res.status(201).json({
                success : true,
                message : "Succesfully create new enrollment",
                data : enrollAndNotif[0]
            })

        } catch (err) {
            next(err)
        }
    },
    
    getMyEnrollment : async (req,res,next) => {
        try {
            const userId = req.user.id

            const EnrolledCourse = await prisma.enrollment.findMany({
                where : {
                    authorId : userId
                }
            })

            const getEnrolledCourseId = EnrolledCourse.length > 0 ? EnrolledCourse.map((i) => {
                return {id : i.courseId}
            }) : []

            
            let {category,level,ispremium,page,limit,se} = req.query
            page = page ? Number(page) : 1
            limit = limit ? Number(limit) : 10
            
            const filters = getAllCourseFilter(ispremium,level,category)
            let coursesCount = await prisma.course.findMany({
                orderBy : [
                    { id : 'asc'}
                ]
            ,
              where : {
                OR : getEnrolledCourseId,
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
                OR : getEnrolledCourseId,
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
                message : "Sucessfully get all enrolled course course",
                data : result
            })

        } catch (err) {
           next(err) 
        }
    }

}