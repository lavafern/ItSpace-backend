module.exports = {
    otherError : (err,req,res,next) => {
        
        console.log(err)
        const errorCode = err.cause || 500


        return res
        .status(errorCode)
        .json({
            success : false,
            message :  err.message,
            data : null
        })
      
    },

    notFoundError : (req,res,next) => {
        return res
        .status(404)
        .json({
            success : false,
            message : "not found",
            data : null
        })
    }
}