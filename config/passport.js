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
      //  callbackURL: "/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        //let foundUser = await user.findOne({ email: profile.emails[0].value });
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
  // console.log("Serializing User:", user);
  // done(null, user._id);
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  
  try {
    const foundUser = await user.findById(id);
    done(null,foundUser);
    console.log("Deserializing User:", foundUser);


    // if (foundUser) {
    //   done(null, foundUser);
    // } else {
    //   done(null, false);
    // }
  } catch (err) {
    done(err, null);
  }
});

// passport.deserializeUser((id,done)=>{
//   user.findById(id)
//   .then(user=>{
//     done(null,user)
//   })
//   .catch(err=>{
//     done(err, null);
//   })
// })

module.exports=passport;