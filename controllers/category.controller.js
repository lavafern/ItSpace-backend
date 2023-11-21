const {prisma} = require("../utils/prismaClient")


module.exports = {

    createCategory : async (req,res,next) => {
        try {
            // TODO: Implement admin authorization 
            const {courseName} = req.body

            if (!courseName) throw new Error("tolong isi semua kolom", {cause : 400})
            const checkCategory = await prisma.category.findUnique({
                where : {
                    name : courseName
                }
            })

            if (checkCategory) throw new Error("Kategori sudah ada", {cause : 400})

            const newCategory = await prisma.category.create({
                data : {
                    name : courseName
                }
            })

            res.json({
                succes : true,
                message : "succes create new category",
                data : newCategory
            })
        } catch (err) {
            next(err)
        }
    },

    getAllCategory : async (req,res,next) => {
        try {
            const categories = await prisma.category.findMany()
            res.json({
                succes : true,
                message : "succes create new category",
                data : categories
            })
        } catch (err) {
            next(err)
        }
    }

     // TODO: add update and delete category
}
