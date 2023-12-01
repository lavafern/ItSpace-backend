const { BadRequestError } = require("../errors/customErrors")
const { prisma } = require("../utils/prismaClient")
const {Prisma} = require("@prisma/client")

module.exports = {
    createTransaction : async (req,res,next) => {
        try {
            const id = 1
            let {courseId,paymentMethod} = req.body

            if (!courseId || !paymentMethod) throw new BadRequestError("Tolong masukan courseId")
            if (isNaN(Number(courseId))) throw new BadRequestError("Tolong masukan courseId")
            
            paymentMethod = paymentMethod.toLowerCase()

            // checks if courseId exist
            const checkCourse = await prisma.course.findUnique({
                where : {
                    id : courseId
                }
            })
            if (!checkCourse) throw new BadRequestError("CourseId tidak valid")
            
            const newTransaction = await prisma.transaction.create({
                data : {
                    expirationDate : new Date(new Date().getTime() + 24 * 60 * 60000),
                    paymentMethod,
                    authorId : id,
                    courseId
                },
                include : {
                    course : true
                }
            })

            delete newTransaction.course.description
            delete newTransaction.course.groupUrl
            delete newTransaction.course.id
            delete newTransaction.course.thumbnailUrl
            delete newTransaction.authorId
            delete newTransaction.courseId
            delete newTransaction.payDate
            delete newTransaction.payDone
            res.status(201).json({
                success : true,
                message : "successfully create new transaction",
                data : newTransaction
            })
        } catch (err) {
            next(err)
        }
    },
    
    getAllTransaction : async (req,res,next) => {
        try {

            const prem = true
            const level = ["BEGINNER", "INTERMEDIATE"]
            const levelFilter = level.length > 0 ? level.map( i => {
                    return {level : i}
                }) : null

            const filters = [levelFilter,prem].map(i => {
                if (Array.isArray(i)) {
                    return {course : {
                        OR : i
                    }}
                }else {
                    return {course : {
                        isPremium : i
                    }}
                }
            })
            const allTransactions = await prisma.transaction.findMany({
                where : {
                    AND : filters
                },
                include : {
                    course : true
                }
            })

            res.send(allTransactions)

        } catch (err) {
            next(err)
        }
    }
}