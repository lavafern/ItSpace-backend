const {decodeToken,signToken} = require("../utils/authUtils")
const {JWT_SECRET,JWT_REFRESH_SECRET} = process.env

module.exports = {
    restrict : async (req,res,next) => {
        try {

            const accesToken = req.cookies.accesToken

            if (!(accesToken) && !(refreshToken)) throw new Error("Unauthorized", {cause : 401})
            const user = await decodeToken('s',JWT_SECRET)
            req.user = user
            next()

        } catch (err) {
            const refreshToken = req.cookies.refreshToken

            try {
                const userData = await decodeToken(refreshToken,JWT_REFRESH_SECRET)
                const userConstruct = {
                    id : userData.id,
                    email : userData.email,
                    profile : userData.profile
                    }
                const accesToken = await signToken('access',userConstruct,JWT_SECRET)
                req.user = userConstruct
                req.accesToken = accesToken
                next()
            } catch (err) {
                next(err)
            }
            
        }
    }
}