const {prisma} = require('../libs/prismaClient');
const {BadRequestError, NotFoundError} = require('../errors/customErrors');


module.exports = {
    
    createCategory : async (req,res,next) => {
        try {
            let {name} = req.body;

            if (!name) throw new BadRequestError('Harap isi semua kolom');
            name = name.toLowerCase();
            const checkCategory = await prisma.category.findUnique({
                where : {
                    name : name
                }
            });

            if (checkCategory) throw new BadRequestError('Kategori sudah ada');

            const newCategory = await prisma.category.create({
                data : {
                    name
                }
            });

            res.status(201).json({
                succes : true,
                message : 'Berhasil menambahkan kategori',
                data : newCategory
            });
        } catch (err) {
            next(err);
        }
    },

    

    getAllCategory : async (req,res,next) => {
        try {
            const categories = await prisma.category.findMany();
            res.status(200).json({
                succes : true,
                message : 'Berhasil mendapatkan semua kategori',
                data : categories
            });
        } catch (err) {
            next(err);
        }
    },
 

    updateCategory : async (req,res,next) => {
        try {
            let {id} = req.params;
            let {name} = req.body;

            id = Number(id);

            if (!name) throw new BadRequestError('Harap isi semua kolom');
            if (!id) throw new BadRequestError('Harap isi Id');
            if (isNaN(id)) throw new BadRequestError('Id harus angka');
            name = name.toLowerCase();

            // check if category exist
            let checkId = prisma.category.findUnique({
                where : {
                    id
                }
            });


            // check if name unique
            let checkName = prisma.category.findUnique({
                where : {
                    name
                }
            });

            [checkId,checkName] = await Promise.all([checkId,checkName]);

            if (!checkId) throw new NotFoundError('Id tidak ditemukan');
            if (checkName) throw new BadRequestError('Gunakan nama lain');

            const updatedCategory = await prisma.category.update({
                where : {
                    id
                },
                data: {
                    name
                }
            });

            res.status(200).json({
                succes : true,
                message : 'Berhasil memperbarui kategori',
                data : updatedCategory
            });
        } catch (err) {
            next(err);
        }
    },

    deleteCategory : async (req,res,next) => {
        try {
            let {id} = req.params;
            id = Number(id);

            if (!id) throw new BadRequestError('Harap isi Id');
            if (isNaN(id)) throw new BadRequestError('Id harus angka');

            //check category is exist
            const checkCategory = await prisma.category.findUnique({
                where : {
                    id 
                }
            });

            if (!checkCategory) throw new NotFoundError('Id tidak ditemukan');


            let deleteCategory = await prisma.category.delete({
                where: { 
                    id
                }
            });

            res.status(200).json({
                status: true,
                message: 'berhasil menghapus kategori',
                data: deleteCategory
            });
        } catch (err) {
            next(err);
        }
    }
     
};
