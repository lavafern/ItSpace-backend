const passport = require("../utils/passport")

module.exports = {
    LoginWithGoogle : (req,res,next) => {
        try {
            res.send(req.user)
        } catch (err) {
            next(err)
        }
    }


}