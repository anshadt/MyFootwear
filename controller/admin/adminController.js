const admin=require('../../routes/admin')
const user=require('../../models/userModel')
const bcrypt=require('bcrypt')
const Order=require('../../models/orderModel')
const Product = require('../../models/productModel')
const Category=require('../../models/categoryModel')


const load_AdminPage=async(req,res)=>{
try {
  res.render("admin/adminLogin")
} catch (error) {
  console.log("Login error: " + error);
      return res.status(500).send('An error occurred during login');
}
   
}


const load_AdminDash=async(req,res)=>{
    try {
      const category = await Category.find({}).sort({saleCount:-1}).limit(10)
      const product=await Product.find({}).sort({saleCount:-1}).limit(10)
      const orders=await Order.find({}).sort({createdAt:-1}).limit(5)
        if(req.session.isAdmin){
            res.render('admin/admin_Dashboard',{orders,product,category,title:'Admin Dashboard'})
        }else{
            return res.redirect('/admin/login')
        }
    } catch (error) {
      console.log("Login error: " + error);
      return res.status(500).send('An error occurred during login');
    }
}




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
  


const load_userMng = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const totalUser = await user.countDocuments({ isAdmin: false });
    const totalPages = Math.ceil(totalUser / limit);
    const users = await user.find({ isAdmin: false }).skip(skip).limit(limit);
    res.render("admin/userMng", {
      userdata: users,
      title: "User Management",
      currentPage: page,
      totalPages,
      totalUser,
      limit
    });
  } catch (error) {
    console.error("Error loading user management page:", error);
    res.status(500).send("An error occurred while loading user data.");
  }
};



const block_user=async(req,res)=>{
    try {
        await user.findByIdAndUpdate(req.params.id,{isBlocked:false});
         res.redirect("/admin/loaduserMng")
    } catch (error) {
        console.error("Error blocking user:", error.message);
        res.status(500).send("An error occurred while blocking the user.");
    }
}


const unblock_user=async(req,res)=>{
    try {
        await user.findByIdAndUpdate(req.params.id,{isBlocked:true});
         res.redirect("/admin/loaduserMng")
    } catch (error) {
        console.error("Error unblocking user:", error.message);
        res.status(500).send("An error occurred while blocking the user.");
    }
}


const logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error logging out");
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