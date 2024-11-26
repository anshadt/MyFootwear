

const User = require('../models/userModel');

module.exports = async (req, res, next) => {
  console.log("Path accessed:", req.path);
  console.log("Session data:", req.session);

  try {
    const excludedPaths = ['/', '/login', '/signup', '/auth/google', '/auth/google/callback'];
    if (excludedPaths.includes(req.path)) {
      console.log("Skipping authentication for:", req.path);
      return next();
    }

    if (req.session.userId) {
      console.log("Session userId:", req.session.userId);

      const existuser = await User.findOne({ _id: req.session.userId });
      console.log("Fetched user:", existuser);

      if (existuser) {
        if (existuser.isBlocked) {
          console.log("User is blocked, destroying session...");
          req.session.destroy((err) => {
            if (err) console.error("Error destroying session:", err);
            return res.redirect('/login');
          });
        } else {
          console.log("User authenticated:", existuser);
          req.user = existuser;
          return next();
        }
      } else {
        console.log("User not found, redirecting to login...");
        return res.redirect('/login');
      }
    } else {
      console.log("No session found, redirecting to login...");
      return res.redirect('/login');
    }
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    return res.redirect('/login');
  }
};
