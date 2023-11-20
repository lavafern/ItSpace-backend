const passport = require("../../utils/passport")
const router = require("express").Router()
const {LoginWithGoogle} = require("../../controllers/user.controllers")

/// login with google routes
router.get('/google', 
 passport.authenticate('google', {scope: ['profile','email']})
)

router.get('/google/callback', 
    passport.authenticate('google', {failureRedirect : '/auth/redirect', session : false}),
    LoginWithGoogle
)

///failure redirect route
router.get('/redirect', (req,res,next) => {
    try {
   
    throw new Error("failed to login with gmail",{cause : 401})

    } catch (err) {
         next(err)
    }
})






module.exports = router
