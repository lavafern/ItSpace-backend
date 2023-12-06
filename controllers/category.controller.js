const {prisma} = require("../utils/prismaClient")
const {ForbiddenError,BadRequestError, NotFoundError} = require("../errors/customErrors")


module.exports = {

    createCategory : async (req,res,next) => {
        try {
            const role = req.user.profile.role

            if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini")
            let {name} = req.body

            if (!name) throw new BadRequestError("Harap isi semua kolom")
            name = name.toLowerCase()
            const checkCategory = await prisma.category.findUnique({
                where : {
                    name : name
                }
            })

            if (checkCategory) throw new BadRequestError("Kategori sudah ada")

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
            const role = req.user.profile.role
            if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini")

            let {id} = req.params
            let {name} = req.body

            id = Number(id)

            if (!name) throw new BadRequestError("Harap isi semua kolom")
            if (!id) throw new BadRequestError("Harap isi Id")
            if (isNaN(id)) throw new BadRequestError("Id harus angka")
            name = name.toLowerCase()

            // check if category exist
            const checkId = await prisma.category.findUnique({
                where : {
                    id
                }
            })
            if (!checkId) throw new NotFoundError("Id tidak ditemukan")

            // check if name unique
            const checkName = await prisma.category.findUnique({
                where : {
                    name
                }
            })
            if (checkName) throw new BadRequestError("Gunakan nama lain")

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
            const role = req.user.profile.role
            if (role !== 'ADMIN') throw new ForbiddenError("Kamu tidak memiliki akses kesini")

            let {id} = req.params
            id = Number(id)

            if (!id) throw new BadRequestError("Harap isi Id")
            if (isNaN(id)) throw new BadRequestError("Id harus angka")

            //check category is exist
            const checkCategory = await prisma.category.findUnique({
                where : {
                    id 
                }
            })

            if (!checkCategory) throw new NotFoundError("Id tidak ditemukan")


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
