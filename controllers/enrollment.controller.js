const { BadRequestError, CourseNotPurchasedError,UserNotVerifiedError } = require('../errors/customErrors');
const { prisma } = require('../libs/prismaClient');
const {getAllCourseFilter} = require('../utils/searchFilters');
const {coursePagination} = require('../utils/pagination');
const { sumDurationCourse } = require('../utils/sumDuration');

module.exports = {
    createEnrollment : async (req,res,next) => {
        try {
            const userid = req.user.id;

            let {courseId} = req.body;
            courseId = Number(courseId);

            if (!courseId) throw new BadRequestError('Tolong masukan courseId');

            // checks if user is verified
            let user = prisma.user.findUnique({
                where : {
                    id : userid
                }
            });


            // checks if course exist
            let checkCourse = prisma.course.findUnique({
                where : {
                    id : courseId
                }
            });

            [user,checkCourse] = await Promise.all([user,checkCourse]);

            if (!(user.verified)) throw new UserNotVerifiedError('Akun belum di verifikasi');
            if (!checkCourse) throw new BadRequestError('CourseId tidak valid');
 
            // checks if enrollment already exist
            let checkEnrollment = await prisma.enrollment.findMany({
                where : {
                    courseId : courseId,
                    authorId : userid
                }
            });
            
            if (checkEnrollment.length > 0)  throw new BadRequestError('Anda telah mendaftar di course ini');
            // chekcs if enrollment premium
            if (checkCourse.isPremium) throw new CourseNotPurchasedError('Anda harus membeli course premium');

            
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
            });

            const pushNotification = prisma.notification.create({
                data : {
                    authorId: userid,
                    type : 'Pendaftaran kelas berhasil',
                    message : `Terima kasih telah melakukan pendaftaran, kelas ${checkCourse.title} sudah bisa kamu akses.`,
                    created_at : new Date(),
                    is_read : false
                }
            });

            const enrollAndNotif = await prisma.$transaction([enrollment,pushNotification]);

            res.status(201).json({
                success : true,
                message : 'Succesfully create new enrollment',
                data : enrollAndNotif[0]
            });
        } catch (err) {
            next(err);
        }
    },
    
    getMyEnrollment : async (req,res,next) => {
        try {
            const userId = req.user.id;

            const EnrolledCourse = await prisma.enrollment.findMany({
                where : {
                    authorId : userId
                }
            });

            const getEnrolledCourseId = EnrolledCourse.length > 0 ? EnrolledCourse.map((i) => {
                return {id : i.courseId};
            }) : [];

            
            let {category,level,ispremium,page,limit,se,order} = req.query;
            page = page ? Number(page) : 1;
            limit = limit ? Number(limit) : 10;
            
            const filters = getAllCourseFilter(ispremium,level,category);

            /// order by : default : lastAccessed, popularity : count of how many enrolled, newest : newest course
            const orderBy = order === 'popularity' ? [{enrollment : {
                _count : 'desc'
            }}] : order === 'newest' ? [ { id : 'desc'}] : undefined;
            
            let couresCount = prisma.course.findMany({
                where : {
                    OR : getEnrolledCourseId,
                    title : {
                        contains : se,
                        mode : 'insensitive'
                    },
                    AND : filters
                }
            });

            let courses = prisma.course.findMany({
                skip : (page - 1) * limit,
                take : limit,
                orderBy : orderBy,
                where : {
                    OR : getEnrolledCourseId,
                    title : {
                        contains : se,
                        mode : 'insensitive'
                    },
                    AND : filters
                },
                select : {
                    id : true,
                    code : true,
                    title: true,
                    price: true,
                    level: true,
                    isPremium: true,
                    description: true,
                    thumbnailUrl: true,
                    enrollment : {
                        where : {
                            authorId : userId
                        },
                        select : {
                            lastAccessed : true
                        }
                    },
                    _count : {
                        select : {
                            chapter : true,
                        }
                    },
                    chapter : {
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
                    }

                }

            });

            [courses,couresCount] = await Promise.all([courses,couresCount]);

            couresCount = await couresCount.length;
            
            // rating section
            const courseIds = courses.map((course) => {
                return {courseId : course.id};
            });

            let aggregation = prisma.rating.groupBy({
                by : 'courseId',
                _avg : {
                    rate : true
                },
                where : {
                    OR : courseIds
                }
            });

            console.log(aggregation);

            // sumduration section
            let sumDurationByCourse = sumDurationCourse();

            [aggregation,sumDurationByCourse] = await Promise.all([aggregation,sumDurationByCourse]);

            /// map rating and duration into course
            courses = courses.map((course) => {
                if ( (course.id).toString() in sumDurationByCourse) {
                    course.duration = sumDurationByCourse[course.id];
                }

                aggregation.forEach(aggergate => {
                    if ( course.id === aggergate.courseId) {
                        course.rate = aggergate._avg.rate;
                        return;
                    }
                });

                course.duration = course.duration ? course.duration : null;
                course.rate = course.rate ? course.rate : null;
                return course;
            });

            //if no order filter, sort it by last accessed
            courses = !order ? courses.sort((a,b) => {
                if (!(b.enrollment[0].lastAccessed)) {
                    return -1;
                } else if (!(a.enrollment[0].lastAccessed)){
                    return 1;
                } else {
                    return a.enrollment[0].lastAccessed - b.enrollment[0].lastAccessed;
                }
            }) : courses;

            const pagination = coursePagination(req,couresCount,page,limit,category,level,ispremium,order,se);
        
            const result = {
                pagination,
                courses
            };

            return res.status(200).json({
                success : true,
                message : 'Sucessfully get all enrolled course course',
                data : result
            });
        } catch (err) {
            next(err);
        }
    }

};