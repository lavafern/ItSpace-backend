const passport = require('../../libs/passport');
const router = require('express').Router();
const {restrict} = require('../../middlewares/authentication.middleware');
const {LoginWithGoogle, register, login, jwtDecode, logout, resendOtp, verifyOtp, sendResetPassword, resetPassword, changePassword} = require('../../controllers/auth.controller');
const {image} = require('../../libs/multer');

router.post('/register',image.single('image'),register);
router.post('/login',login);
router.get('/decode',restrict,jwtDecode);
router.post('/logout',restrict,logout);
router.post('/resend-otp/:email',resendOtp);
router.put('/verify-otp',verifyOtp);
router.get('/reset-password',sendResetPassword);
router.put('/reset-password/:token',resetPassword);
router.put('/change-password',restrict,changePassword);

/// login with google routes
router.get('/google', 
    passport.authenticate('google', {scope: ['profile','email']})
);
 
router.get('/google/callback', 
    passport.authenticate('google', {failureRedirect : '/auth/redirect', session : false}),
    LoginWithGoogle
);
 
///failure redirect route
router.get('/redirect', (req,res,next) => {

    try {
        throw new Error('failed to login with gmail',{cause : 401});
    } catch (err) {
        next(err);
    }

});

module.exports = router;
