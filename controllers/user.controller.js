const passport = require("../utils/passport")
const bcrypt = require("bcrypt")
const { prisma } = require("../utils/prismaClient")
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
            let {email,password,name} = req.body

            if (!email || !password || !name ) throw new Error("Harap isi semua kolom", {cause : 400})
            if (password.length < 8 || password.length > 14 ) throw new Error("Masukan password 8 - 14 karakter", {cause : 400})
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


            const newUser = await prisma.user.create({
                data : {
                    email,
                    password : hashedPassword,
                    profile : {
                        create : {
                            name
                        }
                    }
                }
            })
            delete newUser.googleId
            delete newUser.password

            // TODO: add email activation function

            res.json({
                success : true,
                message : "success create new account",
                data : newUser
            })

        } catch (err) {
            next(err)
        }
    }


}