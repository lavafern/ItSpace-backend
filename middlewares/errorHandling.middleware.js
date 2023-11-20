module.exports = {
    otherError : (err,req,res,next) => {


        if (err.cause === 400) {
            return res
            .status(400)
            .json({
                status : false,
                message : err.message,
                data : null
            })
        }

        if (err.cause === 401) {
            return res
            .status(401)
            .json({
                status : false,
                message : "unauthorized",
                data : null
            })
        }

        return res
        .status(500)
        .json({
            status : false,
            message :  err.message,
            data : null
        })
      
    },

    notFoundError : (req,res,next) => {
        return res
        .status(404)
        .json({
            status : false,
            message : "not found",
            data : null
        })
    }
}