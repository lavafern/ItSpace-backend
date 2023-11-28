const { prisma } = require("../utils/prismaClient")
const {BadRequestError,NotFoundError} = require("../errors/customErrors")

module.exports = {
    getAllUsers : async (req,res,next) => {
        try {

            let users = await prisma.user.findMany({
                include : {
                    profile : true
                }
            })
            users = users.map((i) => {
                delete i.profile.id
                delete i.profile.profilePicture
                delete i.profile.authorId
                delete i.googleId
                console.log(i);
                return i
            })
            res.status(200).json({
                success : true,
                message : "Succesfully get all users",
                data : users
            })
        } catch (err) {
            next(err)
        }
    },

    getUserDetail : async (req,res,next) => {
        try {
            let {id} = req.params
            if (!id) throw new BadRequestError("Sertakan Id")

            id = Number(id)
            if (isNaN(id)) throw new BadRequestError("Id harus angka")

            const userDetail = await prisma.user.findUnique({
                where : {
                    id
                },
                include : {
                    profile : true
                }
            })

            if (!userDetail) throw new NotFoundError("Id tidak ditemukan")
            delete userDetail.password

            res.status(200).json({
                success : true,
                message : "Succesfully get user details",
                data : userDetail
            })

        } catch (err) {
            next(err)
        }
    },

    updateProfile : async (req,res,next) => {
        try {
            // auth
            let {id} = req.params
            let {name,phoneNumber,profilePicture,location} = req.body
            profilePicture = profilePicture || "emptyupdated"
            if (!id) throw new BadRequestError("Sertakan Id")

            id = Number(id)
            if (!name)  throw new BadRequestError("Nama wajib di isi")
            if (isNaN(id)) throw new BadRequestError("Id harus angka")
            if (isNaN(phoneNumber)) throw new BadRequestError("Nomor telepon harus angka")

            //check user exist
            const user = await prisma.profile.findUnique({
                where : {
                    authorId : id
                }
            })

            if (!user) throw new BadRequestError("User tidak ditemukan")

            const updatedProfile = await prisma.profile.update({
                where : {
                    authorId : id
                },
                data : {
                    name,
                    phoneNumber,
                    profilePicture,
                    location
                }
            })
           
            res.status(201).json({
                success : true,
                message : "Succesfully edit profile",
                data : updatedProfile
            })

        } catch (err) {
            next(err)
        }
    },

    deleteUser : async (req,res,next) => {
        try {
            // auth
            let {id} = req.params
            if (!id) throw new BadRequestError("Sertakan Id")
            id = Number(id)
            if (isNaN(id)) throw new BadRequestError("Id harus angka")

            const userDetail = await prisma.user.findUnique({
                where : {
                    id
                }
            })
            if (!userDetail) throw new NotFoundError("Id tidak ditemukan")

            res.status(201).json({
                success : true,
                message : "Succesfully delete user",
                data : userDetail
            })

        } catch (err) {
            next(err)
        }
    }
}