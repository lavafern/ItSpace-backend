const {decodeToken,signToken} = require('../utils/authUtils');
const {JWT_SECRET,JWT_REFRESH_SECRET} = process.env;
const {UnauthorizedError} = require('../errors/customErrors');

module.exports = {
    restrict : async (req,res,next) => {
        try {
            const accesToken = req.cookies.accesToken;

            if (!accesToken ) throw new UnauthorizedError('Unauthorized');
            const user = await decodeToken(accesToken,JWT_SECRET);
            req.user = user;
            next();

        } catch (err) {
            const refreshToken = req.cookies.refreshToken;

            try {
                if (!refreshToken) throw new UnauthorizedError('Unauthorized');

                const userData = await decodeToken(refreshToken,JWT_REFRESH_SECRET);
                const userConstruct = {
                    id : userData.id,
                    email : userData.email,
                    profile : userData.profile
                };
                const accesToken = await signToken('access',userConstruct,JWT_SECRET);
                req.user = userConstruct;
                
                res.cookie('accesToken',accesToken, {httpOnly : true, maxAge: 3600000 * 24 * 7  ,sameSite: 'none', secure: true});
                next();
            } catch (err) {
                next(err);
            }
            
        }
    },
    restrictGuest : async (req,res,next) => {
        try {
            const accesToken = req.cookies.accesToken;

            if (!accesToken) {
                req.user= {
                    id : -1,
                    email : null,
                    profile : {
                        role : null
                    }
                };
                return next();
            }

            const user = await decodeToken(accesToken,JWT_SECRET);
            req.user = user;
            next();

        } catch (err) {
            const refreshToken = req.cookies.refreshToken;
            
            try {
                if (!refreshToken) {
                    req.user= {
                        id : -1,
                        email : null,
                        profile : {
                            role : null
                        }
                    };
                    return next();
                }
                
                const userData = await decodeToken(refreshToken,JWT_REFRESH_SECRET);
                const userConstruct = {
                    id : userData.id,
                    email : userData.email,
                    profile : userData.profile
                };
                const accesToken = await signToken('access',userConstruct,JWT_SECRET);
                req.user = userConstruct;
                req.accesToken = accesToken;
                next();
            } catch (err) {
                req.user= {
                    id : -1,
                    email : null,
                    profile : {
                        role : null
                    }
                };
                next();
            }
        }
    },
    
};