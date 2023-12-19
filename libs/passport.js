const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {prisma} = require('./prismaClient');
const passport = require('passport');

const { GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL } = process.env;


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
},
async function(accessToken, refreshToken, profile, cb) {
    try {
        const user = await prisma.user.upsert({
            where : {
                email : profile.emails[0].value

            },
            update : {
                googleId : profile.id,
                verified : true
            },
            create : {
                email : profile.emails[0].value,
                googleId :  profile.id,
                profile : {
                    create : {
                        name : profile.displayName,
                        role : 'USER',
                        profilePicture : 'https://ik.imagekit.io/itspace/18b5b599bb873285bd4def283c0d3c09.jpg?updatedAt=1701289000673'
                    }
                },
                verified : true

            },
            include : {
                profile : true
            }
        });

        delete user.password;
        delete user.googleId;
        delete user.verified;
        delete user.profile.authorId;
        delete user.profile.name;
        delete user.profile.phoneNumber;
        delete user.profile.profilePicture;
        delete user.profile.joinDate;
        delete user.profile.location ;
        delete user.profile.id ;

        cb(null,user);

    } catch (err) {

        cb(err,null);

    }
}));

module.exports = passport;