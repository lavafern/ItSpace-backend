const {prisma} = require("../utils/prismaClient")

module.exports = {
    createCourse : async (req,res,next) => {
        try {
            let {
                title,price,level,isPremium,description,courseCategory,mentorEmail,code
            } = req.body
            price = Number(price)
            console.log(typeof isPremium);

            if (isNaN(price)) throw new Error("Kolom harga harus diisi angka",{cause : 400})
            if (!title || !price || !level  || !description || !code) throw new Error("Tolong isi kolom yang wajib di isi", {cause : 400})
            if (!(Array.isArray(courseCategory)) || !(Array.isArray(mentorEmail)) ) throw new Error("courseCategory dan mentorEmail harus array", {cause : 400})
            if (!(isPremium === false || isPremium === true)) throw new Error("isPremium harus boolean", {cause : 400})
            if (!(level === "BEGINNER" || level === "INTERMEDIATE" || level === "ADVANCED")) throw new Error("level tidak valid", {cause : 400})
            if (description.length > 1024)  throw new Error("description tidak boleh lebih dari 1024 karakter", {cause : 400})
            if (title.length > 60) throw new Error("title tidak boleh lebih dari 60 karakter", {cause : 400})

            //check if code is exist 
            checkCode = await prisma.course.findUnique({
                where : {
                    code
                }
            })
            if (checkCode) throw new Error("Gunakan kode lain", {cause : 400})

            
            // category data
            const courseCategoryForPrisma = courseCategory.map((c) => {
                return {name : c}
            })

            let categoryId = await prisma.category.findMany({
                where : {
                    OR : courseCategoryForPrisma
                }
            })

            const validCategory = categoryId.map((i) => {
                return i.name
            })
            categoryId = categoryId.map((i) => {
                return {categoryId : i.id}
            })



            // mentor data
            const mentorEmailForPrisma = mentorEmail.map((e) => {
                return {email : e}
            })

            let mentorId = await prisma.user.findMany({
                where : {
                    OR : mentorEmailForPrisma
                }
            })
            const mentorValidEmail = mentorId.map((i) => {
                return i.email
            })

            mentorId = mentorId.map((i) => {
                return {authorId : i.id}
            })


            
            // create new course
            const newCourse = await prisma.course.create({
                data : {
                    code,
                    title,
                    price,
                    level,
                    isPremium,
                    description,
                    courseCategory : {
                        create : categoryId
                    },
                    mentor : {
                        create : mentorId
                    }
                    
                }
            })

            newCourse.mentor = mentorValidEmail
            newCourse.category = validCategory
            

            res.status(201).json({
                success : true,
                message : "succesfully create new course",
                data : newCourse
            })

        } catch (err) {
            next(err)
        }
    },

    updateCourse: async (req, res, next) => {
        try {
            // TODO: Implement admin authorization 
            let courseId = req.params.id;
            let {
                title, price, level, isPremium, description, courseCategory, mentorEmail
            } = req.body;

            price = Number(price);
            courseId = Number(courseId);

            if (isNaN(price)) throw new Error("Kolom harga harus diisi angka", { cause: 400 });
            if (!title || !price || !level || !description) throw new Error("Tolong isi kolom yang wajib di isi", { cause: 400 });
            if (!(Array.isArray(courseCategory)) || !(Array.isArray(mentorEmail))) throw new Error("courseCategory dan mentorEmail harus array", { cause: 400 });
            if (!(isPremium === false || isPremium === true)) throw new Error("isPremium harus boolean", { cause: 400 });
            if (!(level === "BEGINNER" || level === "INTERMEDIATE" || level === "ADVANCED")) throw new Error("level tidak valid", { cause: 400 });
            if (description.length > 1024) throw new Error("description tidak boleh lebih dari 1024 karakter", { cause: 400 });
            if (title.length > 60) throw new Error("title tidak boleh lebih dari 60 karakter", { cause: 400 });

            // category data
            const courseCategoryForPrisma = courseCategory.map((c) => {
                return { name: c };
            });

            let categoryId = await prisma.category.findMany({
                where: {
                    OR: courseCategoryForPrisma,
                },
            });

            const validCategory = categoryId.map((i) => {
                return i.name;
            });
            categoryId = categoryId.map((i) => {
                return { categoryId: i.id };
            });

            // mentor data
            const mentorEmailForPrisma = mentorEmail.map((e) => {
                return { email: e };
            });

            let mentorId = await prisma.user.findMany({
                where: {
                    OR: mentorEmailForPrisma,
                },
            });
            const mentorValidEmail = mentorId.map((i) => {
                return i.email;
            });

            mentorId = mentorId.map((i) => {
                return { authorId: i.id };
            });
            //delete category
            const deleteCategory = await prisma.courseCategory.deleteMany({
                 where: {
                    courseId: courseId
                }
            })
git
            // update course
            const updatedCourse = await prisma.course.update({
                where: {
                    id: courseId,
                },
                data: {
                    title,
                    price,
                    level,
                    isPremium,
                    description,
                    courseCategory : {
                        create : categoryId
                    },
                    mentor : {
                        create : mentorId
                    }

                },
            });

            updatedCourse.mentor = mentorValidEmail;
            updatedCourse.category = validCategory;

            res.json({
                success: true,
                message: "Successfully update course",
                data: updatedCourse,
            });
        } catch (err) {
            next(err);
        }
    },
    // delete course
    deleteCourse: async (req, res, next) => {
        try {
            let { id } = req.params;

            let deleteCourse = await prisma.course.delete({
                where: { id: Number(id) }
            });

            res.status(200).json({
                status: true,
                message: 'Deleted Courses Successfully!',
                data: deleteCourse
            });

        } catch (err) {
            next(err);
        }
    },

};

