const { prisma } = require("../utils/prismaClient")
const {BadRequestError,NotFoundError,UnauthorizedError, ForbiddenError, InternalServerError} = require("../errors/customErrors")
const bcrypt = require("bcrypt")
const imagekit = require("../utils/imagekit")
const path = require("path")
const {userPagination} = require("../utils/pagination")
module.exports = {
    getAllUsers : async (req,res,next) => {
        try {
            let {page,limit} = req.query
            page = page ? Number(page) : 1
            limit = limit ? Number(limit) : 10


            const userCount = await prisma.user.count()


            let users = await prisma.user.findMany({
                skip : (page - 1) * limit,
                take : limit,
                select : {
                    id : true,
                    email :true,
                    verified: true,
                    profile : {
                        select : {
                            name : true,
                            phoneNumber : true,
                            role : true
                        }
                    }
                        
                }
               
            })

            const pagination = userPagination(req,userCount,page,limit)

            const result = {
                pagination,
                users
            }
            res.status(200).json({
                success : true,
                message : "Succesfully get all users",
                data : result
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
                select : {
                    id : true,
                    email : true,
                    verified : true,
                    profile : {
                        select : {
                            name : true,
                            phoneNumber : true,
                            profilePicture : true,
                            role : true,
                            joinDate : true,
                            location : true
                        }
                    }
                }
            })

            if (!userDetail) throw new NotFoundError("Id tidak ditemukan")

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
            let {id} = req.params
            if (!id) throw new InternalServerError("Id tidak valid")
            id = Number(id)
            if (isNaN(id)) throw new InternalServerError("Id tidak valid")


            if (id !== req.user.id) throw new ForbiddenError("Anda tidak punya akses kesini")
            
           
           
            let {name,phoneNumber,location} = req.body

            if (!name)  throw new BadRequestError("Nama wajib di isi")
            if (isNaN(phoneNumber)) throw new BadRequestError("Nomor telepon harus angka")

            //check user exist
            const user = await prisma.profile.findUnique({
                where : {
                    authorId : id
                }
            })

            if (!user) throw new BadRequestError("User tidak ditemukan")

            let profilePicture = !(req.file) ? user.profilePicture : (await imagekit.upload({
                fileName: + Date.now() + path.extname(req.file.originalname),
                file: req.file.buffer.toString('base64')
            })).url

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
           
            delete updatedProfile.id
            delete updatedProfile.authorId

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

    deleteUser : async (req,res,next) => {
        try {
            let {id} = req.params
            if (!id) throw new InternalServerError("Id tidak valid")
            id = Number(id)
            if (isNaN(id)) throw new InternalServerError("Id tidak valid")

            if (id !== req.user.id) throw new ForbiddenError("Anda tidak punya akses kesini")

            const userDetail = await prisma.user.findUnique({
                where : {
                    id
                },
                select : {
                    id : true,
                    email : true,
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