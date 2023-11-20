module.exports = {
    otherError : (err,req,res,next) => {
        
        console.log(err)

        if (err.cause === 400) {
            return res
            .status(400)
            .json({
                success : false,
                message : err.message,
                data : null
            })
        }

        if (err.cause === 401) {
            return res
            .status(401)
            .json({
                success : false,
                message : "unauthorized",
                data : null
            })
        }

        if (err.cause === 403) {
            return res
            .status(403)
            .json({
                success : false,
                message : "forbidden",
                data : null
            })
        }

        return res
        .status(500)
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