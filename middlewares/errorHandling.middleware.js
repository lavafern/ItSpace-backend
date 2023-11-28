const {NotFoundError} = require("../errors/customErrors")

module.exports = {
    otherError : (err,req,res,next) => {

           console.log(err);
            
           return res
            .status(err.statusCode)
            .json({
                success : false,
                message : err.message,
                data : null
            })
    },

    notFoundError : (req,res,next) => {
        try {
            throw new NotFoundError("Not found")
        } catch (err) {
            console.log(err);
            return res
            .status(err.statusCode)
            .json({
                success : false,
                message : err.message,
                data : null
            })
        }
        
    }
}