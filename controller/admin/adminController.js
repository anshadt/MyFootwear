const admin=require('../../routes/admin')
const user=require('../../models/userModel')
const bcrypt=require('bcrypt')
const Order = require('../../models/orderModel')

//Admin Login Page Loading
const load_AdminPage=(req,res)=>{
    //res.render("admin/adminLogin")
    try {
      res.render("admin/adminLogin")
    } catch (error) {
      console.log("Login error: " + error);
          return res.status(500).send('An error occurred during login');
    }
}

//Admin Dashboard Page Loading
const load_AdminDash = async(req,res)=>{
  try {
    const orders=await Order.find({}).sort({createdAt:-1}).limit(5)
      if(req.session.isAdmin){
          res.render('admin/admin_Dashboard',{orders,title:'Admin Dashboard'})
      }else{
          return res.redirect('/admin/adminLogin')
      }
  } catch (error) {
    console.log("Login error: " + error);
    return res.status(500).send('An error occurred during login');
  }
}

//Admin Dashboard
const admin_Dashboard = async (req, res) => {
    try {
      const { email, Password } = req.body;
      const findAdmin = await user.findOne({ email: email });
   
      
      if (!findAdmin) {
        return res.status(400).json({error:"Email and password is required"})
      }
      const checkPass = await bcrypt.compare(Password, findAdmin.password);
      if (!checkPass) {
        return res.status(400).json({error:"Email and password is required"})
      }
      if (findAdmin.isAdmin) {
        req.session.isAdmin = true;
        req.session.adminEmail = findAdmin.email;
        return res.status(200).json({success:true,successRedirectUrl:"/admin/loadAdminDash"});
      } else {
        return res.status(400).json({error:"Incorrect Email and password"})
      }
  
    } catch (error) {
      console.log("Login error: " + error);
      return res.status(500).send('An error occurred during login');
    }
  };
  

//User Manage Page Loading
const load_userMng=async(req,res)=>{
    try {
          const userdata = await user.find({ isAdmin: false });
          res.render("admin/userMng", { userdata, title: "userMng" });
       
      } catch (error) {
        console.log(error);
      }
} 

//User Block Sectioin
const block_user=async(req,res)=>{
    try {
        await user.findByIdAndUpdate(req.params.id,{isBlocked:false});
         res.redirect("/admin/loaduserMng")
        
    } catch (error) {
        console.error("Error blocking user:", error.message);
        res.status(500).send("An error occurred while blocking the user.");
    }
}

//User Unblock Section
const unblock_user=async(req,res)=>{
    try {
        await user.findByIdAndUpdate(req.params.id,{isBlocked:true});
         res.redirect("/admin/loaduserMng")
    } catch (error) {
        console.error("Error unblocking user:", error.message);
        res.status(500).send("An error occurred while blocking the user.");
    }
}

//Admin Logout Section
const logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error logging out')
      } else {
        res.redirect("/admin/login");
      }
    });
  };

  



module.exports={
    load_AdminPage,
    admin_Dashboard,
    load_AdminDash,
    load_userMng,
    block_user,
    unblock_user,
    logout
}