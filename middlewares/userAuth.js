
module.exports=(req,res,next)=>{
    try {
      if(req.session && req.session.userId){
        return next()
      }else{
        res.redirect('/')
      }
    } catch (error) {
      return res.status(500).send('An error occurred during login');
    }
      };





    
