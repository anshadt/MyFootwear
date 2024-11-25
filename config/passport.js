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
      console.log('hi')
      try {
        console.log('hi1')
        let foundUser = await user.findOne({ googleId: profile.id });

        if (foundUser) {
          console.log('hi2')
          return done(null, foundUser);
        } else {
          const newUser = await new user({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id
          });
          const savedUser = await newUser.save();
          console.log('hi3')
          return done(null, savedUser);
        }
      } catch (err) {
        console.log('hi4')
        return done(err, null);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  console.log("Serializing User:", user);
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  console.log("Serializing User:", user);
  try {
    const foundUser = await user.findById(id);
    done(null,foundUser);
    console.log("Deserializing User:", foundUser);
  } catch (err) {
    done(err, null);
  }
});


module.exports=passport;