const {prisma} = require("../utils/prismaClient")

module.exports = {
    createCourse : async (req,res,next) => {
        try {
            let {
                title,price,level,isPremium,description,courseCategory,mentorEmail
            } = req.body
            price = Number(price)



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
                    title,
                    price,
                    level,
                    isPremium,
                    description,
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


}