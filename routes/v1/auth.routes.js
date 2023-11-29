const passport = require("../../utils/passport")
const router = require("express").Router()
const {restrict} = require("../../middlewares/auth.middleware")
const {LoginWithGoogle, register, login, jwtDecode, logout, resendOtp, verifyOtp, resetPassword} = require("../../controllers/auth.controller")


router.post('/register',register)
router.post('/login',login)
router.get('/decode',restrict,jwtDecode)
router.post('/logout',restrict,logout)
router.post('/resend-otp/:email',resendOtp)
router.put('/verify-otp/:email',verifyOtp)
router.get('/reset-password/:email',resetPassword)



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
