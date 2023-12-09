const { CourseNotPurchasedError, BadRequestError } = require("../errors/customErrors");
const { prisma } = require("../utils/prismaClient");

module.exports = {
    createRating : async (req,res,next) => {
        const userId = req.user.id
        const {courseId,rating} = req.body
        
        if (!courseId) throw new BadRequestError("Tolong isi courseId")
        if (isNaN(Number(courseId))) throw new BadRequestError("CourseId tidak valid")
        if (isNaN(Number(rating))) throw new BadRequestError("CourseId tidak valid")
        if (rating < 1 || rating > 5) throw new BadRequestError("Rating harus dari 1 - 5")
        courseId = Number(courseId)

        const checkEnrollment = await prisma.enrollment.findMany({
            where : {
                authorId : userId,
                courseId : courseId
            }
        })

        if (checkEnrollment.length < 1 ) throw new CourseNotPurchasedError("Kamu harus daftar course ini untuk memberi rating")

        
        const checkRating = await prisma.rating.findMany({
            where : {
                authorId : userId,
                courseId : courseId
            }
        })
        
        // checks if rating already exist, if not exist id is -1 to trigger create
        ratingId = checkRating.length < 1 ? -1 : checkRating[0].id


        const newRating = await prisma.rating.upsert({
            where : {
                id : ratingId
            },
            update : {
                rate : rating
            },
            create : {
                authorId : userId,
                courseId : courseId,
                rate : rating
            },
            
            select : {
                id : true,
                rate : true,
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
        })

    }
}