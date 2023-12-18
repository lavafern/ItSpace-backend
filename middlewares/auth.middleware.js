const {decodeToken,signToken} = require("../utils/authUtils")
const {JWT_SECRET,JWT_REFRESH_SECRET} = process.env
const {UnauthorizedError} = require("../errors/customErrors")

module.exports = {
    restrict : async (req,res,next) => {
        try {

            const accesToken = req.cookies.accesToken

            if (!accesToken ) throw new UnauthorizedError("Unauthorized")
            const user = await decodeToken(accesToken,JWT_SECRET)
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
    },
    restrictChapters : async (req,res,next) => {
        try {

            const accesToken = req.cookies.accesToken
            const refreshToken = req.cookies.refreshToken

            if (!accesToken && !refreshToken) {
                req.user= {
                    id : -1
                }
                return next()
            }

            const user = await decodeToken(accesToken,JWT_SECRET)
            req.user = user
            next()

        } catch (err) {
            console.log('getiner',err);
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