
const User = require('../models/userModel');

module.exports = async (req, res, next) => {
  // Skip this middleware for login or signup routes
  const excludedPaths = ['/login', '/signup']; // Add paths you want to exclude
  if (excludedPaths.includes(req.path)) {
    return next();
  }

  if (req.session.userId) {
    try {
      const existuser = await User.findOne({ _id: req.session.userId });
      if (existuser) {
        if (existuser.isBlocked) {
          req.session.destroy((err) => {
            if (err) {
              console.log(err);
            }
            return res.redirect('/login');
          });
        } else {
          // Attach user to req object
          req.user = existuser;
          return next();
        }
      } else {
        return res.redirect('/login');
      }
    } catch (error) {
      console.log('Error in fetching user:', error);
      return res.redirect('/login');
    }
  } else {
    return res.redirect('/login');
  }
};
