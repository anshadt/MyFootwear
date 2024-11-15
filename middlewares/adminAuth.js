
module.exports=async(req,res,next)=>{
    try {
        if(req.session && req.session.isAdmin){
            return next()
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        
    }
}