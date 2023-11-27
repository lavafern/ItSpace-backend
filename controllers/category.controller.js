const {prisma} = require("../utils/prismaClient")


module.exports = {

    createCategory : async (req,res,next) => {
        try {
            const role = req.user.profile.role
            let {name} = req.body
            name = name.toLowerCase()

            if (!name) throw new Error("tolong isi semua kolom", {cause : 404})
            name = name.toLowerCase()
            const checkCategory = await prisma.category.findUnique({
                where : {
                    name : name
                }
            })

            if (checkCategory) throw new Error("Kategori sudah ada", {cause : 400})

            const newCategory = await prisma.category.create({
                data : {
                    name
                }
            })

            res.status(201).json({
                succes : true,
                message : "succesfully create new category",
                data : newCategory
            })
        } catch (err) {
            next(err)
        }
    },

    getAllCategory : async (req,res,next) => {
        try {
            const categories = await prisma.category.findMany()
            res.status(200).json({
                succes : true,
                message : "succesfully get all category",
                data : categories
            })
        } catch (err) {
            next(err)
        }
    },

    updateCategory : async (req,res,next) => {
        try {
            let {id} = req.params
            let {name} = req.body

            id = Number(id)

            if (!name) throw new Error("tolong isi semua kolom",{cause : 400})
            if (!id) throw new Error("id tidak boleh kosong",{cause : 400})
            if (isNaN(id)) throw new Error("id harus angka",{cause : 400})
            name = name.toLowerCase()

            // check if category exist
            const checkId = await prisma.category.findUnique({
                where : {
                    id
                }
            })
            if (!checkId) throw new Error("id tidak valid",{cause : 400})

            // check if name unique
            const checkName = await prisma.category.findUnique({
                where : {
                    name
                }
            })
            if (checkName) throw new Error("gunakan nama lain",{cause : 400})

            const updatedCategory = await prisma.category.update({
                where : {
                    id
                },
                data: {
                    name
                }
            })

            res.status(200).json({
                succes : true,
                message : "succesfully update category",
                data : updatedCategory
            })


        } catch (err) {
            next(err)
        }
    },

    deleteCategory : async (req,res,next) => {
        try {
            let {id} = req.params
            id = Number(id)

            if (!id) throw new Error("id tidak boleh kosong",{cause : 400})
            if (isNaN(id)) throw new Error("id harus angka",{cause : 400})

            //check category is exist
            const checkCategory = await prisma.category.findUnique({
                where : {
                    id 
                }
            })
            if (!checkCategory)throw new Error("Id tidak valid", { cause: 400 })


            let deleteCategory = await prisma.category.delete({
                where: { 
                    id
                 }
            });

            res.status(200).json({
                status: true,
                message: 'Successfully delete category',
                data: deleteCategory
            });

        } catch (err) {
            next(err)
        }
    }
     
}
