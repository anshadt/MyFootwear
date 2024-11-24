const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const user = require("../models/userModel");
require("dotenv").config();


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
     
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        
        let foundUser = await user.findOne({ googleId: profile.id });

        if (foundUser) {
          return done(null, foundUser);
        } else {
          const newUser = await new user({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id
          });
          const savedUser = await newUser.save();
          return done(null, savedUser);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  
  try {
    const foundUser = await user.findById(id);
    done(null,foundUser);
    console.log("Deserializing User:", foundUser);
  } catch (err) {
    done(err, null);
  }
});


module.exports=passport;