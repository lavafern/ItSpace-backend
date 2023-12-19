const { BadRequestError, ForbiddenError, UserNotVerifiedError } = require('../errors/customErrors');
const { transactionsPagination } = require('../utils/pagination');
const { prisma } = require('../libs/prismaClient');
const { getAllTransactionFilter } = require('../utils/searchFilters');
const {transactionPagination} = require('../utils/pagination');
const {sumDuration} = require('../utils/sumDuration');

module.exports = {
    createTransaction : async (req,res,next) => {
        try {
            const authorId = req.user.id;
           
            let {courseId,paymentMethod} = req.body;

            if (!courseId || !paymentMethod) throw new BadRequestError('Tolong isi semua kolom');
            if (!(paymentMethod === 'VIRTUAL_ACCOUNT' || paymentMethod === 'E_WALLET' || paymentMethod === 'GERAI_RETAIL') ) throw new BadRequestError('PaymentMethod harus VIRTUAL_ACCOUNT / GERAI_RETAIL / E_WALLET');
            if (isNaN(Number(courseId))) throw new BadRequestError('Tolong isi semua kolom');
            courseId = Number(courseId);

            // checks if user is verified
            const user = await prisma.user.findUnique({
                where : {
                    id : authorId
                }
            });

            if (!(user.verified)) throw new UserNotVerifiedError('Akun belum di verifikasi');

            // checks if courseId exist
            const checkCourse = await prisma.course.findUnique({
                where : {
                    id : courseId
                }
            });

            if (!checkCourse) throw new BadRequestError('CourseId tidak valid');
            if (!checkCourse.isPremium) throw new BadRequestError('Course ini gratis');

            // checks if transactions is done
            const checkTransactionDone = await prisma.transaction.findMany({
                where : {
                    authorId,
                    courseId,
                    payDone : true
                }
            });

            if (checkTransactionDone.length > 0) throw new BadRequestError('Course ini sudah anda beli');

            //check unfinished transaction
            const checkTransactionNotDone = await prisma.transaction.findMany({
                where : {
                    authorId,
                    courseId,
                    payDone : false
                }
            });

            const transactionId = checkTransactionNotDone.length < 1 ? -1 :  checkTransactionNotDone[0].id;

            const newTransaction = await prisma.transaction.upsert({
                where : {
                    id : transactionId
                },
                update : {
                    expirationDate : new Date(new Date().getTime() + 24 * 60 * 60000),
                    paymentMethod,
                },
                create : {
                    date: new Date(),
                    expirationDate : new Date(new Date().getTime() + 24 * 60 * 60000),
                    paymentMethod : paymentMethod,
                    authorId,
                    courseId,
                },
                select : {
                    id : true,
                    date : true,
                    expirationDate : true,
                    payDone : true,
                    payDate : true,
                    paymentMethod : true,
                    course : {
                        select : {
                            id : true,
                            code : true,
                            title : true,
                            price : true,
                            level : true,
                            isPremium : true,

                        }
                    }
                }
            });


            //menambahkan notifikasi telah melakukan pembelian
            await prisma.notification.create({
                data : {
                    authorId,
                    created_at : new Date(),
                    is_read : false,
                    type : 'Transaksi',
                    message : `Terima kasih telah melakukan pembelian kelas ${checkCourse.title}. Segera lakukan pembayaran untuk segera mengakses kursus.`,
                }
            });

            res.status(201).json({
                success : true,
                message : 'successfully create new transaction',
                data : newTransaction
            });
        } catch (err) {
            next(err);
        }
    },
    
    getAllTransaction : async (req,res,next) => {
        try {

            let {status,courseCode,method,se,from,to,page,limit} = req.query;

            page = page ? Number(page) : 1;
            limit = limit ? Number(limit) : 10;

            to = to ? new Date(new Date(to).getTime() + (24 * 60 * 60 * 999)) : undefined;
            from = from ? new Date(from) : undefined;

            if ((to === undefined && from) || (to && from === undefined)) throw new BadRequestError('Jika menggunakan filter tanggal, gunakan kedua parameter (to & from)');

            const filters = getAllTransactionFilter(courseCode,status,method);
            const transactions = await prisma.transaction.findMany({
                orderBy : [
                    { id : 'desc'}
                ],
                skip : (page - 1) * limit,
                take : limit,
                where : {
                    course : {
                        title : {
                            contains : se,
                            mode : 'insensitive'
                        }
                    },
                    date : {
                        lte : to,
                        gte : from
                    },
                    AND : filters
                },
                select : {
                    id : true,
                    date : true,
                    expirationDate : true,
                    payDone : true,
                    payDate : true,
                    paymentMethod : true,
                    course : {
                        select : {
                            id : true,
                            code : true,
                            title : true,
                            price : true,
                            level : true,
                            isPremium : true,

                        }
                    }
                }
            });


            const pagination = transactionPagination(req,null,page,limit,status,courseCode,method,from,to);

            const result = {
                pagination,
                transactions
            };

            res.status(200).json({
                success : true,
                message : 'Succesfully get all transactions',
                data : result
            });

        } catch (err) {
            next(err);
        }
    },
    getTransactionDetail : async (req,res,next) => {
        try {
            const authorId = req.user.id;
            const role = req.user.profile.role;
            let {id} = req.params;
            if (!id) throw new BadRequestError('Tolong masukan Id transaksi');
            if (isNaN(Number(id))) throw new BadRequestError('Id transaksi tidak valid');
            id = Number(id);

            //checks if transaction is valid
            const transaction = await prisma.transaction.findUnique({
                where : {
                    id
                },
                select : {
                    id : true,
                    date : true,
                    expirationDate : true,
                    payDone : true,
                    payDate : true,
                    paymentMethod : true,
                    course : {
                        select : {
                            id : true,
                            code : true,
                            title : true,
                            price : true,
                            level : true,
                            isPremium : true,

                        }
                    }
                }
            });

            if (!transaction) throw new BadRequestError('Id transaksi tidak valid');
            if (authorId !== transaction.authorId && role !== 'ADMIN') throw new ForbiddenError('Kamu tidak memiliki akses kesini');

            res.status(200).json({
                success : true,
                message : 'Succesfully get transaction detail',
                data : transaction
            });
        } catch (err) {
            next(err);
        }
    },

    payTransaction : async (req,res,next) => {
        try {
            let {id} = req.params;
            const authorId = req.user.id;

            if (!id) throw new BadRequestError('Tolong masukan Id transaksi');
            if (isNaN(Number(id))) throw new BadRequestError('Id transaksi tidak valid');
            id = Number(id);

            //checks if transaction is valid
            const transaction = await prisma.transaction.findUnique({
                where : {
                    id
                }
            });

            if (!transaction) throw new BadRequestError('Id transaksi tidak valid');
            if (transaction.payDone) throw new BadRequestError('Transaksi telah dibayar');
            if (transaction.authorId !== authorId)  throw new ForbiddenError('Anda tidak memiliki akses kesini');

            // update database transaction done
            const doneTransaction  = prisma.transaction.update({
                where : {
                    id  : transaction.id
                },
                data : {
                    payDone : true,
                    payDate : new Date()
                },
                select : {
                    id : true,
                    date : true,
                    expirationDate : true,
                    payDone : true,
                    payDate : true,
                    paymentMethod : true,
                    course : {
                        select : {
                            id : true,
                            code : true,
                            title : true,
                            price : true,
                            level : true,
                            isPremium : true,

                        }
                    }
                }
            });

            //directly enroll course when transaction is done
            const enrollCourse = prisma.enrollment.create({
                data : {
                    date : new Date(),
                    authorId : transaction.authorId,
                    courseId : transaction.courseId
                }
            });


            const pushNotification = prisma.notification.create({
                data : {
                    authorId ,
                    type : 'Pembayaran dan pendaftaran kelas premium berhasil',
                    message : `Terima kasih telah melakukan pembayaran, kelas premium ${(await doneTransaction).course.title} sudah bisa kamu akses.`,
                    created_at : new Date(),
                    is_read : false
                }
            });


            const payAndEnroll = await prisma.$transaction([doneTransaction,enrollCourse,pushNotification]);

            res.status(201).json({
                success : true,
                message : 'Transaction paid succesfully',
                data : payAndEnroll
            });
        } catch (err) {
            next(err);
        }
    },

    deleteTransaction : async (req,res,next) => {
        try {
            let {id} = req.params;
            const role = req.user.profile.role;
            const authorId = req.user.id;

            if (!id) throw new BadRequestError('Tolong masukan Id transaksi');
            if (isNaN(Number(id))) throw new BadRequestError('Id transaksi tidak valid');
            id = Number(id);

            /// checks if transaction is valid
            const validTransaction = await prisma.transaction.findUnique({
                where : {
                    id
                }
            });

            if (!validTransaction) throw new BadRequestError('Transaksi tidak ditemukan');
            if (role !== 'ADMIN' && validTransaction.payDone === true) throw new ForbiddenError('kamu tidak memiliki akses ksesini');
            if (authorId !== validTransaction.authorId && role !== 'ADMIN'  && validTransaction.payDone === false) throw new ForbiddenError('kamu tidak memiliki akses kesini');

            const deleteTransaction = await prisma.transaction.delete({
                where : {
                    id
                },
                select : {
                    id : true,
                    date : true,
                    expirationDate : true,
                    payDone : true,
                    payDate : true,
                    paymentMethod : true,
                    course : {
                        select : {
                            id : true,
                            code : true,
                            title : true,
                            price : true,
                            level : true,
                            isPremium : true,
                        }
                    }
                }
            });

            res.status(201).json({
                success : true,
                message : 'Succesfully delete transaction',
                data : deleteTransaction
            });
        } catch (err) {
            next(err);
        }
    },
    myTransactions : async (req,res,next) => {
        try {
            const userId = req.user.id;

            let {status,courseCode,method,se,from,to,page,limit} = req.query;
            
            page = page ? Number(page) : 1;
            limit = limit ? Number(limit) : 10;

            to = to ? new Date(new Date(to).getTime() + (24 * 60 * 60 * 999)) : undefined;
            from = from ? new Date(from) : undefined;

            if ((to === undefined && from) || (to && from === undefined)) throw new BadRequestError('Jika menggunakan filter tanggal, gunakan kedua parameter (to & from)');


            const filters = getAllTransactionFilter(courseCode,status,method);


            let transactions = await prisma.transaction.findMany({
                orderBy : [
                    { id : 'desc'}
                ],
                skip : (page - 1) * limit,
                take : limit,
                where : {
                    authorId : userId,
                    course : {
                        title : {
                            contains : se,
                            mode : 'insensitive'
                        }
                    },
                    date : {
                        lte : to,
                        gte : from
                    },
                    AND : filters
                },
                select : {
                    id : true,
                    date : true,
                    expirationDate : true,
                    payDone : true,
                    payDate : true,
                    paymentMethod : true,
                    courseId : true,
                    course : {
                        select : {
                            id : true,
                            code : true,
                            title : true,
                            price : true,
                            level : true,
                            isPremium : true,
                            thumbnailUrl: true,
                            _count : {
                                select : {
                                    chapter : true
                                }
                            },
                            courseCategory : {
                                select : {
                                    category : {
                                        select : {
                                            name : true
                                        }
                                    }
                                }
                            },
                            mentor : {
                                select : {
                                    author : {
                                        select : {
                                            profile : {
                                                select : {
                                                    name : true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });


            const aggregation = await prisma.rating.groupBy({
                by : 'courseId',
                _avg : {
                    rate : true
                }
            });

            const sumDurationByCourse = await sumDuration();


            /// map rating into transactions
            transactions = transactions.map((transaction) => {
                aggregation.forEach(aggregate => {

                    if ( (transaction.course.id).toString() in sumDurationByCourse) {
                        transaction.course.duration = sumDurationByCourse[transaction.course.id];
                    }
        
                    if (transaction.courseId === aggregate.courseId) {
                        transaction.course.rate = aggregate._avg.rate;
                        return;
                    }
                });

                transaction.course.duration = transaction.course.duration ? transaction.course.duration : null;
                transaction.course.rate = transaction.course.rate ? transaction.course.rate : null;
                return transaction;
            });
            

            console.log(transactions);


            const pagination = transactionsPagination(req,null,page,limit,status,courseCode,method,from,to);

            const result = {
                pagination,
                transactions
            };

            res.status(200).json({
                success : true,
                message : 'Succesfully get my transactions',
                data : result
            });


        } catch (err) {
            next(err);
        }
    }
};