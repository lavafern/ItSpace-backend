const GoogleStrategy = require('passport-google-oauth20').Strategy
const prisma = require('./prismaClient')
const passport = require("passport")

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
                googleId : profile.id
            },
            create : {
                email : profile.emails[0].value,
                googleId :  profile.id,
                profile : {
                    create : {
                        name : profile.displayName,
                        role : "user"
                    }
                }

            }
        })

        cb(null,user)

    } catch (err) {

         cb(err,null)

    }
  
  }
))

module.exports = passport