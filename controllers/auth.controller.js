const bcrypt = require('bcrypt');
const { prisma } = require('../libs/prismaClient');
const {JWT_SECRET,JWT_REFRESH_SECRET,JWT_RESETPASSWORD_SECRET,RESET_PASSWORD_URL,FRONTEND_HOME_URL} = process.env;
const {sendEmail} = require('../utils/sendEmail');
const {otpHtml} = require('../views/templates/emailVerification');
const {resetPasswordHtml} = require('../views/templates/resetPassword');
const {generateOtp,signToken, decodeToken} = require('../utils/authUtils');
const {BadRequestError,UnauthorizedError,NotFoundError, UserNotVerifiedError} = require('../errors/customErrors');
const imagekit = require('../libs/imagekit');
const path = require('path');
const notValidToken = 'ccf5ce427fa3697f09aec480969abe9c0810118a78c4ce92264b3d76e54bc277a8bad331ebb942ba24c2a8680b684ad0cc1765dd84842ed967278883f8f78b16';

module.exports = {
    googleLoginFrontend : async (req,res,next) => {
        try {
            const {email,family_name,given_name,sub} = req.body;

            if(!family_name || !given_name || !sub || !email) throw new BadRequestError('data tidak lengkap');

            const name = `${given_name} ${family_name}`;

            const user = await prisma.user.upsert({
                where : {
                    email : email
    
                },
                update : {
                    googleId : sub,
                    verified : true
                },
                create : {
                    email : email,
                    googleId :  sub,
                    profile : {
                        create : {
                            name : name,
                            role : 'USER',
                            profilePicture : 'https://ik.imagekit.io/itspace/18b5b599bb873285bd4def283c0d3c09.jpg?updatedAt=1701289000673'
                        }
                    },
                    verified : true
    
                },
                include : {
                    profile : true
                }
            });


            const userConstruct = {
                id : user.id,
                email : user.email,
                profile : user.profile
            };

            delete userConstruct.profile.city;
            delete userConstruct.profile.country;

            const accesToken = await signToken('access',userConstruct,JWT_SECRET);
            const refreshToken = await signToken('refresh',userConstruct,JWT_REFRESH_SECRET);
            
            res
                .cookie('accesToken',accesToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                .cookie('refreshToken',refreshToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                .status(201).json({
                    success : true,
                    message : 'success create new account',
                    data : userConstruct
                });

        } catch (err) {
            next(err);
        }
    },
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
                .cookie('refreshToken',refreshToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                .redirect(FRONTEND_HOME_URL);
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


            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

            if (!(emailRegex.test(email))) throw new BadRequestError('Email tidak valid');

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
            if (verifyUser.verified) throw new BadRequestError('User sudah terverifikasi');

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

            const foundUser = await prisma.user.update({
                where : {
                    email
                },
                data : {
                    verified : true
                },
                select : {
                    id : true,
                    email : true,
                    password : true,
                    verified : true,
                    profile : {
                        select : {
                            role : true
                        }
                    }
                }
            });

            delete foundUser.password;

            res
                .status(201).json({
                    success : true,
                    message : 'successfully verify email',
                    data : foundUser
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
                    verified : true,
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

            if (!(foundUser.verified)) {
                res.cookie('otpEmail', email, { sameSite: 'none', httpOnly: false, secure: true });
                throw new UserNotVerifiedError('Tolong verifikasi akun anda');
            }

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
                .cookie('accesToken',notValidToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true})
                .cookie('refreshToken',notValidToken, {httpOnly : true, maxAge: 3600000 * 24 * 7, sameSite: 'none', secure: true})
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

            if (!foundUser.password) throw new BadRequestError('Kamu belum memasang password!');
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


            //menambahkan notifikasi
            await prisma.notification.create({
                data : {
                    authorId : id,
                    created_at : new Date(),
                    is_read : false,
                    type : 'Ubah password',
                    message : 'password akun Anda telah berhasil diubah. Ini adalah langkah keamanan yang baik untuk melindungi informasi akun Anda.',
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

    setPassword : async (req,res,next) => {
        try {
            const authorId = req.user.id;

            const {newPassword,newPasswordValidation} = req.body;

            if (!newPassword || !newPasswordValidation) throw new BadRequestError('Harap isi semua kolom');
            if (newPassword !== newPasswordValidation) throw new BadRequestError('Password dan validasi tidak sama');
            if (newPassword.length < 8 || newPassword.length > 14 ) throw new BadRequestError('Harap masukan password 8 - 14 karakter');


            const foundUser = await prisma.user.findUnique({
                where : {
                    id : authorId
                }
            });

            if (foundUser.password) throw new BadRequestError('Kamu sudah memasang password');

            const hashedPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(newPassword, 10, function(err, hash) {
                    if (err) reject(err);
                    resolve(hash) ;
                });
            }); 

            const setPassword = await prisma.user.update({
                where : {
                    id : authorId
                },
                data : {
                    password : hashedPassword
                }
            });

            delete setPassword.googleId;
            delete setPassword.password;

            res.status(201).json({
                success : true,
                message : 'Succesfully set password',
                data : setPassword
            });

        } catch (err) {
            next(err);
        }
    },

    jwtDecode : (req,res,next) => {
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
    },
    checkEnrollmentOfCourse : async (req,res,next) => {
        try {
            const userid = req.user.id;
            let {courseId} = req.params;

            if (!courseId) throw new BadRequestError('Tolong masukan courseId');
            if (isNaN(Number(courseId))) throw new BadRequestError('Tolong masukan angka untuk courseId');
            
            courseId = Number(courseId);

            const checkEnrollment = await prisma.enrollment.findMany({
                where : {
                    authorId : userid,
                    courseId : courseId
                }
            });

            const result = checkEnrollment.length > 0 ? true : false;

            return res.status(200).json({
                success : true,
                message : 'if this user have enrolled?',
                data : result
            });
        } catch (err) {
            next(err);
        }
    }


};