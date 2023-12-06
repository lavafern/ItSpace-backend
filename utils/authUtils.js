const jwt = require("jsonwebtoken")
const {UnauthorizedError, InternalServerError} = require("../errors/customErrors")
module.exports = {
    generateOtp : () => {
        try {

            let otp = ''

            for (let index = 0; index < 4; index++) {
                otp += Math.floor(Math.random() * 10)

            }

            return otp
               
        } catch (err) {
            next(err)
        }
    },
    decodeToken : (token,secret) => {
        return new Promise((resolve,reject) => {
            jwt.verify(token,secret,(err,decode) => {
                if (err) reject(new UnauthorizedError("Unauthorized"))
                resolve(decode)
            })
        })
    },
    signToken : (type,payload,secret) => {
        if (type !== 'access' && type !== 'refresh' && type !== 'resetPassword') throw new InternalServerError("wrong token type")
        const expiresIn = type === 'access' ? '5s' :  type === 'refresh' ?'30d' : '600s'
        return new Promise((resolve,reject) => {
            jwt.sign(payload, secret,  {expiresIn : expiresIn}, function(err, token) {
                if (err) reject(err)
                resolve(token)
              })
        })
    }
}