const { BadRequestError, ForbiddenError } = require('../errors/customErrors');
const { prisma } = require('../libs/prismaClient');


module.exports = {
    getMyNotification : async (req,res,next) => {
        try {
            const authorId = req.user.id;

            const myNotifications = await prisma.notification.findMany({
                where : {
                    authorId
                }
            });

            res.status(200).json({
                success : true,
                message : 'Berhasil mendapatkan notifikasi saya',
                data : myNotifications
            });
        } catch (err) {
            next(err);
        }
    },
    deleteNotification : async (req,res,next) => {
        try {
            const authorId = req.user.id;
            let {id} = req.params;

            if (!id) throw new BadRequestError('Tolong masukan id notifikasi');
            if (isNaN(Number(id))) throw new BadRequestError('id harus integer');
            id = Number(id);

            // cheks if notification id exist
            const checkNotification = await prisma.notification.findUnique({
                where : {
                    id
                }
            });

            if (!checkNotification) throw new BadRequestError('Id notifikasi tidak ditemukan');
            if (authorId !== checkNotification.authorId) throw new ForbiddenError('Anda tidak punya akses kesini');

            const deleteNotification = await prisma.notification.delete({
                where : {
                    id
                }
            });

            res.status(200).json({
                success : true,
                message : 'Berhasil menghapus notifikasi',
                data : deleteNotification
            });
        } catch (err) {
            next(err);
        }
    },

    readNotification : async (req,res,next) => {
        try {
            const authorId = req.user.id;
            let {id} = req.params;

            if (!id) throw new BadRequestError('Tolong masukan id notifikasi');
            if (isNaN(Number(id))) throw new BadRequestError('id harus integer');
            id = Number(id);

            // cheks if notification id exist
            const checkNotification = await prisma.notification.findUnique({
                where : {
                    id
                }
            });

            if (!checkNotification) throw new BadRequestError('Id notifikasi tidak ditemukan');
            if (authorId !== checkNotification.authorId) throw new ForbiddenError('Anda tidak punya akses kesini');

            const updateNotification = await prisma.notification.update({
                where : {
                    id
                },
                data : {
                    is_read : true
                }
            });

            res.status(201).json({
                success : true,
                message : 'Berhasil membaca notifikasi',
                data : updateNotification
            });
        } catch (err) {
            next(err);
        }
    }
};