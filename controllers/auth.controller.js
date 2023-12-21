const bcrypt = require('bcrypt');
const { prisma } = require('../libs/prismaClient');
const {JWT_SECRET,JWT_REFRESH_SECRET,JWT_RESETPASSWORD_SECRET,RESET_PASSWORD_URL} = process.env;
const {sendEmail} = require('../utils/sendEmail');
const {otpHtml} = require('../views/templates/emailVerification');
const {resetPasswordHtml} = require('../views/templates/resetPassword');
const {generateOtp,signToken, decodeToken} = require('../utils/authUtils');
const {BadRequestError,UnauthorizedError,NotFoundError} = require('../errors/customErrors');
const imagekit = require('../libs/imagekit');
const path = require('path');
// const {FRONTEND_DOMAIN} = process.env;

module.exports = {
    LoginWithGoogle : async (req,res,next) => {
        try {
            console.log(req.user);

            const userConstruct = {
                id : req.user.id,
                email : req.user.email,
                profile : req.user.profile
            };

            delete userConstruct.profile.city;
            delete userConstruct.profile.country;

            const accesToken = await signToken('access',userConstruct,JWT_SECRET);

            const refreshToken = await signToken('refresh',userConstruct,JWT_REFRESH_SECRET);
            
            res
                .cookie('accesToken',accesToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                .cookie('refreshToken',refreshToken, {httpOnly : true, maxAge: 3600000 * 24 * 7, sameSite: 'none', secure: true})
                .status(200).json({
                    success : true,
                    message : 'successfully login with google',
                    data : req.user
                });
        } catch (err) {
            next(err);
        }
    },

    register : async (req,res,next) => {
        try {
            let {email,password,passwordValidation,name} = req.body;
            let profilePicture = !(req.file) ? 'https://ik.imagekit.io/itspace/18b5b599bb873285bd4def283c0d3c09.jpg?updatedAt=1701289000673' : (await imagekit.upload({
                fileName: + Date.now() + path.extname(req.file.originalname),
                file: req.file.buffer.toString('base64')
            })).url;

            if (!email || !password || !name || !passwordValidation) throw new BadRequestError('Harap isi semua kolom');
            if (password.length < 8 || password.length > 14 ) throw new BadRequestError('Harap masukan password 8 - 14 karakter');
            if (password !== passwordValidation ) throw new BadRequestError('Validasi password salah');
            if (name.length > 35)  throw new BadRequestError('Harap masukan nama tidak lebih dari 35 karakter');
            
            //checks if email already used
            const checkEmail = await prisma.user.findUnique({
                where : {
                    email
                }
            });

            if (checkEmail) throw new BadRequestError('Email sudah terdaftar');
            
            /// hashing password
            const hashedPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(password, 10, function(err, hash) {
                    if (err) reject(err);
                    resolve(hash);
                });
            });

            if (!hashedPassword) throw new Error('Gagal mengenkripsi password');

            const otp = generateOtp();
            

            const newUser = await prisma.user.create({
                data : {
                    email,
                    password : hashedPassword,
                    profile : {
                        create : {
                            name,
                            profilePicture
                        }
                    },
                    otp : {
                        create : {
                            otp : otp,
                            expiration : new Date(new Date().getTime() + 10 * 60000)
                        }
                    }
                }
            });

            const html = otpHtml(otp);

            sendEmail(email,'Verify Your Email',html);
            
            delete newUser.googleId;
            delete newUser.password;

            res
                .cookie('otpEmail', email, { sameSite: 'none', httpOnly: false, secure: true })
                .status(201).json({
                    success : true,
                    message : 'success create new account',
                    data : newUser
                });
        } catch (err) {
            next(err);
        }
    },
    resendOtp : async (req,res,next) => {
        try {
            const {email} = req.params;
            const otp = generateOtp();

            if (!email) throw new BadRequestError('Email tidak boleh kosong');

            const verifyUser = await prisma.user.findUnique({
                where :  {
                    email
                }
            });

            if (!verifyUser) throw new BadRequestError('User belum terdaftar');

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
            });

            const html = otpHtml(otp);
            sendEmail(email,'New Otp',html);

            res.status(201).json({
                success : true,
                message : 'succesfully send new otp',
                data : verifyUser.email
            });
        } catch (err) {
            next(err);
        }
    },

    verifyOtp : async (req,res,next) => {
        try {


            const {otp,email} = req.body;

            if (!email || !otp) throw new BadRequestError('Harap isi semua kolom');
            if (isNaN(Number(otp))) throw new BadRequestError('Otp harus angka');

            const userData = await prisma.user.findUnique({
                where : {
                    email
                },
                include : {
                    otp : true
                }
            });

            if (userData.otp.otp !== otp) throw new UnauthorizedError('Otp salah');
            if (userData.otp.expiration < new Date()) throw new UnauthorizedError('Otp kadaluarsa');

            const verifyingUser = await prisma.user.update({
                where : {
                    email
                },
                data : {
                    verified : true
                }
            });

            delete verifyingUser.password;
            delete verifyingUser.googleId;
            res.status(201).json({
                success : true,
                message : 'successfully verify email',
                data : verifyingUser
            });
        } catch (err) {
            next(err);
        }
    },

    login : async (req,res,next) => {
        try {
            const {email,password} = req.body;
            if (!email || !password) throw new BadRequestError('Harap isi semua kolom');

            let foundUser = await prisma.user.findUnique({
                where : {
                    email
                },
                select : {
                    id : true,
                    email : true,
                    password : true,
                    profile : {
                        select : {
                            role : true
                        }
                    }
                }
            });

            if (! foundUser) throw new UnauthorizedError('Email / password salah');

            //checks if password correct
            const comparePassword = await new Promise((resolve,reject) => {
                bcrypt.compare(password,foundUser.password,function (err,result) {
                    if (err) reject(err);
                    resolve(result);
                });
            });

            delete foundUser.password;

            if (!comparePassword) throw new UnauthorizedError('Email / password salah');

            const accesToken = await signToken('access',foundUser,JWT_SECRET);
            const refreshToken = await signToken('refresh',foundUser,JWT_REFRESH_SECRET);

            res
                .cookie('accesToken',accesToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                .cookie('refreshToken',refreshToken, {httpOnly : true, maxAge: 3600000 * 24 * 7, sameSite: 'none', secure: true})
                .status(200).json({
                    success : true,
                    message : 'login success',
                    data : foundUser
                });


        } catch (err) {
            next(err);
        }
    },
    
    logout : (req,res,next) => {
        try {
            res
                .status(200)
                .clearCookie('accesToken')
                .clearCookie('refreshToken')
                .json({
                    success : true,
                    message : 'successfully logout',
                    data : null
                });
        } catch (err) {
            next(err);
        }
    },
    
    sendResetPassword : async (req,res,next) => {
        try {
            const {email} = req.params;
            if (!email) throw new BadRequestError('Email harus di isi');
            const user = await prisma.user.findUnique({
                where : {
                    email
                } 
            });
            if (!user) throw new NotFoundError('Email tidak terdaftar');
            const token = await signToken('resetPassword',{email : user.email},JWT_RESETPASSWORD_SECRET);
            const html = resetPasswordHtml(token,RESET_PASSWORD_URL);
            sendEmail(email,'Reset Your Password',html);

            res.status(200).json({
                success : true,
                message : 'success sending email',
                data :  user.email
            });
        } catch (err) {
            next(err);
        }
    },
    resetPassword : async (req,res,next) => {
        try {
            const {token} = req.params ;
            const {newPassword,newPasswordValidation} = req.body;
            const decode = await decodeToken(token,JWT_RESETPASSWORD_SECRET);
            const {email} = decode;

            if (!newPassword || !newPasswordValidation ) throw new BadRequestError('Harap isi semua kolom');
            if (newPassword.length < 8 || newPassword.length > 14 ) throw new BadRequestError('Harap masukan password 8 - 14 karakter');
            if (newPassword !== newPasswordValidation ) throw new BadRequestError('Validasi password salah');

            const hashedPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(newPassword, 10, function(err, hash) {
                    if (err) reject(err);
                    resolve(hash) ;
                });
            });

            if (!hashedPassword) throw new Error('Gagal mengenkripsi password');

            const updatePassword = await prisma.user.update({
                where : {
                    email
                },
                data : {
                    password : hashedPassword
                }
            });

            delete updatePassword.password;
            delete updatePassword.verified;
            delete updatePassword.googleId;

            res.status(201).json({
                success : true,
                message  : 'Succesfully reset password',
                data : updatePassword
            });

        } catch (err) {
            next(err);
        }
    },
    changePassword : async (req,res,next) => {
        try {
            const {id} = req.user;
            const {oldPassword,newPassword,newPasswordValidation} = req.body;

            if (!newPassword || !newPasswordValidation ) throw new BadRequestError('Harap isi semua kolom');
            if (newPassword.length < 8 || newPassword.length > 14 ) throw new BadRequestError('Harap masukan password 8 - 14 karakter');
            if (newPassword !== newPasswordValidation ) throw new BadRequestError('Validasi password salah');

            const foundUser = await prisma.user.findUnique({
                where : {
                    id
                }
            });

            //checks if password correct
            const comparePassword = await new Promise((resolve,reject) => {
                bcrypt.compare(oldPassword,foundUser.password,function (err,result) {
                    if (err) reject(err);
                    resolve(result);
                });
            });

            if (!comparePassword) throw new UnauthorizedError('Email / password salah');

            const newHashedPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(newPassword, 10, function(err, hash) {
                    if (err) reject(err);
                    resolve(hash) ;
                });
            });

            if (!newHashedPassword) throw new Error('Gagal mengenkripsi password');

            const updatePassword = await prisma.user.update({
                where : {
                    id
                },
                data : {
                    password : newHashedPassword
                }
            });

            delete updatePassword.password;
            delete updatePassword.verified;
            delete updatePassword.googleId;

            res.status(201).json({
                success : true,
                message  : 'Succesfully reset password',
                data : updatePassword
            });
        } catch (err) {
            next(err);
        }
    },

    jwtDecode : async (req,res,next) => {
        try {
            if (req.accesToken) {
                return res
                    .status(200)
                    .cookie('accesToken',req.accesToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                    .json({
                        success : true,
                        message : 'jwt verify succes, new acces token generated',
                        data : req.user
                    });
            }

            return res.status(200).json({
                success : true,
                message : 'jwt verify succes',
                data : req.user
            });
        } catch (err) {
            next(err);
        }
    }


};