const { prisma } = require("../utils/prismaClient")
const {BadRequestError,NotFoundError,UnauthorizedError, ForbiddenError, InternalServerError} = require("../errors/customErrors")
const bcrypt = require("bcrypt")
const imagekit = require("../utils/imagekit")
const path = require("path")
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
            console.log(req.user);
            let {id} = req.params
            if (!id) throw new InternalServerError("Sertakan Id")

            id = Number(id)
            if (isNaN(id)) throw new InternalServerError("Id harus angka")

            if (id !== req.user.id) throw new ForbiddenError("Anda tidak punya akses kesini")

           
           
            let {name,phoneNumber,profilePicture,location} = req.body
            profilePicture = profilePicture || "emptyupdated"

            if (!name)  throw new BadRequestError("Nama wajib di isi")
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

    changePassword : async (req,res,next) => {
        try {
            console.log(req.user);
            let {id} = req.params
            if (!id) throw new InternalServerError("Sertakan Id")

            id = Number(id)
            if (isNaN(id)) throw new InternalServerError("Id harus angka")

            if (id !== req.user.id) throw new ForbiddenError("Anda tidak punya akses kesini")

            const {currentPassword,newPassword,newPasswordValidation} = req.body
            console.log(req.body);
            if (newPassword !== newPasswordValidation) throw new BadRequestError("validasi password baru salah")
            if (newPassword.length < 8 || newPassword.length > 14 ) throw new BadRequestError("Harap masukan password 8 - 14 karakter")

            const foundUser = await prisma.user.findUnique({
                where : {
                    id
                }
            })
            if (!foundUser) throw new NotFoundError("User tidak ditemukan")

            const comparePassword = await new Promise((resolve,reject) => {
                bcrypt.compare(currentPassword,foundUser.password,function (err,result) {
                    if (err) reject(err)
                    resolve(result)
                })
            })
            if (!comparePassword) throw new UnauthorizedError("Password salah")

            /// hashing password
            const hashedNewPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(newPassword, 10, function(err, hash) {
                    if (err) reject(err)
                    resolve(hash) 
                });
            })

            const updatePassword = await prisma.user.update({
                where : {
                    id
                },
                data : {
                    password : hashedNewPassword
                }
            })
            delete updatePassword.password
            delete updatePassword.googleId
            delete updatePassword.verified
            res.status(201).json({
                success : true,
                message : "Succesfully change Password",
                data : updatePassword
            })

        } catch (err) {
            next(err)
        }
    },

    changeProfilePicture : async (req,res,next) => {
        try {
            let {id} = req.params
            if (!id) throw new InternalServerError("Sertakan Id")

            id = Number(id)
            if (isNaN(id)) throw new InternalServerError("Id harus angka")

            if (id !== req.user.id) throw new ForbiddenError("Anda tidak punya akses kesini")


            let strFile = req.file.buffer.toString('base64');

            let { url } = await imagekit.upload({
                fileName: `${id}` + Date.now() + path.extname(req.file.originalname),
                file: strFile
            })

            const foundUser = await prisma.profile.findUnique({
                where : {
                    authorId : id
                }
            })
            if (!foundUser) throw new NotFoundError("User tidak ditemukan")

            const updateProfilePicture = await prisma.profile.update({
                where : {
                    authorId : id
                },
                data : {
                    profilePicture : url
                }
            })

            delete updateProfilePicture.authorId
            delete updateProfilePicture.joinDate
            delete updateProfilePicture.location
            delete updateProfilePicture.phoneNumber
            delete updateProfilePicture.role

            res.status(201).json({
                success : true,
                message : "Succesfully change profile pic",
                data :  updateProfilePicture
            })

        } catch (err) {
            next(err)
        }
    },

    deleteUser : async (req,res,next) => {
        try {
            console.log(req.user);
            let {id} = req.params
            if (!id) throw new InternalServerError("Sertakan Id")

            id = Number(id)
            if (isNaN(id)) throw new InternalServerError("Id harus angka")

            if (id !== req.user.id) throw new ForbiddenError("Anda tidak punya akses kesini")


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