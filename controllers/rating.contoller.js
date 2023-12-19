const { CourseNotPurchasedError, BadRequestError, ForbiddenError } = require('../errors/customErrors');
const { prisma } = require('../libs/prismaClient');

module.exports = {
    createRating : async (req,res,next) => {
        try {
            const userId = req.user.id;
            let {courseId,rating} = req.body;

            if (!courseId) throw new BadRequestError('Tolong isi courseId');
            if (isNaN(Number(courseId))) throw new BadRequestError('CourseId tidak valid');
            if (isNaN(Number(rating))) throw new BadRequestError('Rating tidak valid');
            if (!Number.isInteger(Number(rating))) throw new BadRequestError('Rating tidak valid');
            if (rating < 1 || rating > 5) throw new BadRequestError('Rating harus dari 1 - 5');

            courseId = Number(courseId);
            rating = Number(rating);

            const checkEnrollment = await prisma.enrollment.findMany({
                where : {
                    authorId : userId,
                    courseId : courseId
                }
            });

            if (checkEnrollment.length < 1 ) throw new CourseNotPurchasedError('Kamu harus daftar course ini untuk memberi rating');


            const checkRating = await prisma.rating.findMany({
                where : {
                    authorId : userId,
                    courseId : courseId
                }
            });

            // checks if rating already exist, if not exist id is -1 to trigger create
            const ratingId = checkRating.length < 1 ? -1 : checkRating[0].id;


            const newRating = await prisma.rating.upsert({
                where : {
                    id : ratingId
                },
                update : {
                    rate : rating
                },
                create : {
                    authorId : userId,
                    courseId : courseId,
                    rate : rating
                },

                select : {
                    id : true,
                    rate : true,
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
                message : 'Successfully give rating',
                data : newRating
            });
        } catch (err) {
            next(err);
        }

    },
    deleteRating : async (req,res,next) => {
        try {
            const userId = req.user.id;
            let {id} = req.params;

            if (!id) throw new BadRequestError('Tolong masukan rating id');
            if (isNaN(Number(id))) throw new BadRequestError('rating id tidak valid');
            id = Number(id);

            ///checks if rating is exist
            const ratingData = await prisma.rating.findMany({
                where : {
                    id
                }
            });


            if (!ratingData) throw new BadRequestError('Rating tidak ada');
            if (userId !== ratingData.authorId) throw new ForbiddenError('Anda tidka memiliki akses kesini');

            const deleteRating = await prisma.rating.delete ({
                where : {
                    id
                },
                select : {
                    id : true,
                    rate : true,
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

            res.status(200).json({
                success : true,
                message : 'Succesfully delete rating',
                data : deleteRating
            });

        } catch (err) {
            next(err);
        }
    }
};