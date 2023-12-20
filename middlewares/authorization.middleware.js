const { ForbiddenError } = require('../errors/customErrors');

module.exports = {
    adminAccess : (req,res,next) => {
        try {
            const role = req.user.profile.role;

            if (role !== 'ADMIN') throw new ForbiddenError('Kamu tidak memiliki akses kesini');

            next();
        } catch (err) {
            next(err);
        }
    }
};