const User = require('../models/userModel');

module.exports = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const existuser = await User.findOne({ _id: req.session.userId }); 
      if (existuser && existuser.isBlocked) {
        req.session.destroy((err) => {
          if (err) {
            console.log(err);
          }
          res.redirect('/login');
        });
      } else {
        next();
      }
    } catch (error) {
      console.log('Error in fetching user:', error);
      res.redirect('/login'); 
    }
  } else {
    next();
  }
};
