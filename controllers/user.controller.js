//const passport = require("../utils/passport")
const bcrypt = require("bcrypt")
const { prisma } = require("../utils/prismaClient")
const {JWT_SECRET,JWT_REFRESH_SECRET,FRONTEND_URL,RESET_PASSWORD_URL} = process.env
const {sendEmail} = require("../utils/sendEmail")
const {otpHtml} = require("../views/templates/emailVerification")
const {resetPasswordHtml} = require("../views/templates/resetPassword")
const {generateOtp,signToken} = require("../utils/authUtils")
module.exports = {
    LoginWithGoogle : (req,res,next) => {
        try {
            res.send(req.user)
        } catch (err) {
            next(err)
        }
    },

    register : async (req,res,next) => {
        try {
            let {email,password,passwordValidation,name,role} = req.body
            role = role ?  "ADMIN" : "USER"
            if (!email || !password || !name || !passwordValidation) throw new Error("Harap isi semua kolom", {cause : 400})
            if (password.length < 8 || password.length > 14 ) throw new Error("Masukan password 8 - 14 karakter", {cause : 400})
            if (password !== passwordValidation )throw new Error("Password validation salah", {cause : 400})
            if (name.length > 35)  throw new Error("Masukan nama tidak lebih dari 35 karakter", {cause : 400})
            
            //checks if email already used
            const checkEmail = await prisma.user.findUnique({
                where : {
                    email
                }
            })

            if (checkEmail) throw new Error("Email telah digunakan, silahkan gunakan email lain",{cause : 400})
            
            /// hashing password
            const hashedPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(password, 10, function(err, hash) {
                    if (err) reject(err)
                    resolve(hash) 
                });
            })

            if (!hashedPassword) throw new Error("Gagal mengenkripsi password")

            const otp = generateOtp()
            

            const newUser = await prisma.user.create({
                data : {
                    email,
                    password : hashedPassword,
                    profile : {
                        create : {
                            name,
                            role
                        }
                    },
                    otp : {
                        create : {
                            otp : otp,
                            expiration : new Date(new Date().getTime() + 10 * 60000)
                        }
                    }
                }
            })
            const html = otpHtml(otp)

            sendEmail(email,"Verify Your Email",html)
            
            delete newUser.googleId
            delete newUser.password

            res.status(201).json({
                success : true,
                message : "success create new account",
                data : newUser
            })

        } catch (err) {
            next(err)
        }
    },
    resendOtp : async (req,res,next) => {
        try {
            const {email} = req.params
            const otp = generateOtp()

            if (!email) throw new Error("email tidak boleh kosong", {cause : 400})

            const verifyUser = await prisma.user.findUnique({
                where :  {
                    email
                }
            })

            if (!verifyUser) throw new Error("User dengan email ini tidak terdaftar", {cause : 401})

            await prisma.otp.upsert({
                where : {
                    authorId : verifyUser.id
                },
                update: {
                    otp : otp,
                    expiration : new Date(new Date().getTime() + 10 * 60000)
                  },
                create : {
                    otp : otp,
                    expiration : new Date(new Date().getTime() + 10 * 60000),
                    authorId : verifyUser.id
                }
            })

            const html = otpHtml(otp)
            sendEmail(email,"New Otp",html)

            res.status(201).json({
                success : true,
                message : "succesfully send new otp",
                data : verifyUser.email
            })

        } catch (err) {
            next(err)
        }
    },

    verifyOtp : async (req,res,next) => {
        try {
            const {email} = req.params
            const {otp} = req.body

            if (!email || !otp) throw new Error("Harap isi semua kolom", {cause : 400})
            if (isNaN(Number(otp))) throw new Error("Otp harus angka", {cause : 400})

            const userData = await prisma.user.findUnique({
                where : {
                    email
                },
                include : {
                    otp : true
                }
            })

            if (userData.otp.otp !== otp) throw new Error("Otp salah",{cause : 401})
            if (userData.otp.expiration < new Date()) throw new Error("Otp kadaluarsa",{cause : 401})
            const verifyingUser = await prisma.user.update({
                where : {
                    email
                },
                update : {
                    verified : true
                }
            })
            delete verifyingUser.password
            delete verifyingUser.googleId
            res.status(201).json({
                success : true,
                message : "successfully verify email",
                data : verifyingUser
            })
        } catch (err) {
            next(err)
        }
    },

    login : async (req,res,next) => {
        try {
            const {email,password} = req.body
            if (!email || !password) throw new Error("Tolong isi semua kolom",{cause : 400})

            let foundUser = await prisma.user.findUnique({
                where : {
                    email
                },
                include : {
                    profile : true
                }
            })

            if (! foundUser) throw new Error("Email atau password salah",{cause : 400})

            //checks if password correct
            const comparePassword = await new Promise((resolve,reject) => {
                bcrypt.compare(password,foundUser.password,function (err,result) {
                    if (err) reject(err)
                    resolve(result)
                })
            })

            delete foundUser.password
            delete foundUser.googleId
            delete foundUser.verified
            delete foundUser.profile.authorId
            delete foundUser.profile.name
            delete foundUser.profile.phoneNumber
            delete foundUser.profile.profilePicture
            delete foundUser.profile.joinDate
            delete foundUser.profile.location 
            delete foundUser.profile.id 



            if (!comparePassword) throw new Error("Email atau password salah",{cause : 400})

            const accesToken = await signToken('access',foundUser,JWT_SECRET)

            const refreshToken = await signToken('refresh',foundUser,JWT_REFRESH_SECRET)
            
            res
            .cookie("accesToken",accesToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
            .cookie("refreshToken",refreshToken, {httpOnly : true, maxAge: 3600000 * 24 * 7, sameSite: 'none', secure: true})
            .status(200).json({
                success : true,
                message : "login success",
                data : {role : foundUser.profile.role}
            })


        } catch (err) {
            next(err)
        }
    },
    
    logout : async (req,res,next) => {
        try {
            
            res
            .status(200)
            .clearCookie('accesToken')
            .clearCookie('refreshToken')
            .json({
                success : true,
                message : "successfully logout",
                data : null
            })
        } catch (err) {
            next(err)
        }
    },
    
    resetPassword : async (req,res,next) => {
        try {
            const {email} = req.params
            if (!email) throw new Error("Email harus ada", {cause : 400})
            const user = await prisma.user.findUnique({
                where : {
                    email
                } 
            })
            if (!user) throw new Error("Email tidak terdaftar",{cause : 400})
            const token = await signToken('refresh',{email : user.email},JWT_REFRESH_SECRET)
            const html = resetPasswordHtml(token,RESET_PASSWORD_URL)
            sendEmail(email,"Reset Your Password",html)

            res.status(200).json({
                success : true,
                message : "success sending email",
                data :  user.email
            })
        } catch (err) {
            next(err)
        }
    },


    jwtDecode : async (req,res,next) => {
        try {
            if (req.accesToken) {
                return res
                .status(200)
                .cookie("accesToken",req.accesToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                .json({
                    success : true,
                    message : "jwt verify succes, new acces token generated",
                    data : req.user
                })
            }

            return res.status(200).json({
                success : true,
                message : "jwt verify succes",
                data : req.user
            })
        } catch (err) {
            next(err)
        }
    }


}