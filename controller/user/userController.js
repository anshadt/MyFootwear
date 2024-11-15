const nodemailer = require('nodemailer'); 
const crypto=require('crypto')
const env=require('dotenv').config(); 
const bcrypt = require('bcrypt'); 
const moment = require('moment-timezone');
const validator = require('validator');
const User = require('../../models/userModel'); 
const category=require('../../models/categoryModel')
const product=require('../../models/productModel');
const OTP=require('../../models/otpModel')
const { name } = require('ejs');
const Cart=require('../../models/cartModel')
const Wishlist=require('../../models/wishlistModel')
const Offer=require('../../models/offerModel')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const Order = require('../../models/orderModel');
const path = require('path');
const Wallet = require('../../models/walletModel');
const { addReferralBonusToWallet } = require('../user/walletController');




const loadIndexPage = async(req, res) => {
    try {
        if(req.session.email){
            res.redirect("/userHomePage")
        }else{
            const Category = await category.find({ isDeleted: false });
            const Product = await product.find({ isDelete: false });
            res.render('user/index',{Category,Product})
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });  
    }
    
};

const loadLogin = (req, res) => {
    if(req.session.email){
        res.redirect("/userHomePage")
    }else {
        res.render('user/loginPage');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ email: email });

        if (!findUser) {
            return res.status(400).json({ error: "Incorrect username and password" });
        }
        if (findUser.isBlocked) {
            return res.status(400).json({ error: "User is blocked" });
        }
        const isPasswordValid = await bcrypt.compare(password, findUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Incorrect username and password" });
        }
        req.session.userId = findUser._id;
        req.session.email = findUser.email;
        console.log("Session data set on login:", req.session);
        if (findUser.isAdmin) {
            req.session.isAdmin = true;
            return res.status(200).json({ success: true, redirect: '/adminDashboard' });
        } else {
            req.session.isAdmin = false;
            const Category = await category.find({ isDeleted: false });
            const Product = await product.find({ isDelete: false });
            return res.status(200).json({ success: true, redirect: '/userHomePage' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};




const loadSignup = async (req, res) => {
    try {
        return res.render('user/signupPage');
    } catch (error) {
        console.log('Signup page not loading', error);
        res.status(500).send('Server Error');
    }
};

function generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp);
    return otp;
}

async function sendVerificationEmail(email, otp) {
    try {
        console.log('Sending email to:', email);
        console.log('OTP:', otp);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b> Your OTP: ${otp} </b>`,
        });

        
        console.log('Email info:', info);
        return info.accepted.length > 0;
    } catch (error) {
        console.error('Error sending email', error);
        return false;
    }
}




const generateReferralCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    
    code = Math.random().toString(36).substring(2, 8).toUpperCase(); 

    
    const existingUser = await User.findOne({ referralCode: code });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return code;
};
const signup = async (req, res) => {
    try {
      const { name, email, password, referralUsed } = req.body;
        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json({ error: 'email-error' });
        }
        
        req.session.userOtp = otp;
        req.session.userData = { name, email, password,referralUsed };
        console.log('Stored OTP in session:', req.session.userOtp);
        console.log('Stored referralUsed in session:', req.session.userData.referralUsed);
        
        
        
        res.json({ success: true });

        
        console.log("OTP sent:", otp);

    } catch (error) {
        console.error('Error during signup:', error);
        res.redirect("/error");
    }
};



const securePassword=async(password)=>{
    try {
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash;
    } catch (error) {
        
    }
}


const otpPage=async(req,res)=>{
    res.render("user/otpForm")
}

const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log('Received OTP from form:', otp);
    console.log('Session OTP:', req.session.userOtp);

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      
      const saveUserData = new User({
        name: user.name,
        email: user.email,
        password: passwordHash,
        referralCode: await generateReferralCode(),
        referralUsed: user.referralUsed, 
        hasUsedReferral: !!user.referralUsed, 
      });
      
      const newUser = await saveUserData.save();
      console.log("New user saved:", newUser);

    
      console.log('User referralUsed:', user.referralUsed);
      if (user.referralUsed) {
        const referrer = await User.findOne({ referralCode: user.referralUsed });
        if (referrer) {
            console.log("Referrer found:", referrer);
            await addReferralBonus(referrer._id, 'Referred a user');
        }

        await addReferralBonus(newUser._id, 'Used referral code');
    }

      req.session.user = newUser._id;
      res.json({ success: true, redirectUrl: "/login" });
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
    }
  } catch (error) {
    console.error("Error Verify OTP", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};


async function addReferralBonus(userId, description) {
  
  const wallet = await Wallet.findOne({ user: userId });

  console.log("Existing wallet for user", userId, ":", wallet);

  if (wallet) {
    
    wallet.balanceAmount += 50;
    wallet.wallet_history.push({
      date: new Date(),
      amount: 50,
      referralId: userId,  
      description,
      transactionType: 'credited',
    });

    console.log("Updated wallet:", wallet);
    await wallet.save();
  } else {
    
    const newWallet = new Wallet({
      user: userId,
      balanceAmount: 50,  
      wallet_history: [
        {
          date: new Date(),
          amount: 50,
          referralId: userId,  
          description,
          transactionType: 'credited',
        },
      ],
    });

    console.log("Created new wallet:", newWallet);
    await newWallet.save();
  }
}



const resendOtp = async (req, res) => {
    console.log("Resend OTP route hit");  

    try {
        
        if (!req.session || !req.session.userData) {
            return res.status(400).json({ success: false, message: "No user session data" });
        }

        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP", otp);
            return res.status(200).json({ success: true, message: "OTP Resent Successfully" });
        } else {
            return res.status(500).json({ success: false, message: "Failed to resend OTP" });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// const loadUserHomePage = async (req, res) => {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 6;
//     const skip = (page - 1) * limit;
  
//     try {
    
//      const  offer= await Offer.find({isDelete: false,offerStartDate: { $lte: new Date() }});
//       const totalProducts = await product.countDocuments({ isDelete: false });
//       const totalPages = Math.ceil(totalProducts / limit);

//       const user = await User.findById(req.session.userId).lean();
    
//       const cart = await Cart.findOne({ user: user._id }).populate("items.product");
//       const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')
      
//       const products = await product.find({ isDelete: false })
//         .skip(skip)
//         .limit(limit)
//         .lean();
  
//         let cartCount = 0;
//         if (cart && cart.items && cart.items.length > 0) {
//            cart.items.forEach(item => {
//            cartCount += item.quantity; 
//         });
//     } 
//     let wishlistCount=0;
//       if(wishlist){
//         wishlistCount  = wishlist.items.length;
//       }    
//       const Category = await category.find({ isDeleted: false }).lean();
  
//       res.render('user/menuPage', {
//         user: user, 
//         Category: Category,
//         products: products,
//         currentPage: page,
//         totalPages: totalPages,
//         cartCount,
//         wishlistCount,
//         offer
//       });
//     } catch (error) {
//       console.error('Error loading user home page:', error);
//       res.status(500).send('An error occurred while loading the page');
//     }
//   };
  
const loadUserHomePage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;
  const searchParams = {
    search: req.query.search || '',      // Default empty search term
    minPrice: req.query.min_price || 0,  // Default minimum price
    maxPrice: req.query.max_price || Infinity, // Default maximum price
    sort: req.query.sort || 'newest'     // Default sort order
  };

  try {
      const Category = await category.find({ isDeleted: false }).lean();
      const  offer= await Offer.find({isDelete: false,offerStartDate: { $lte: new Date() }});
    const totalProducts = await product.countDocuments({ isDelete: false });
    const totalPages = Math.ceil(totalProducts / limit);

    const user = await User.findById(req.session.userId).lean();
  
    const cart = await Cart.findOne({ user: user._id }).populate("items.product");
    const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')

   
      const products = await product.find({ isDelete: false }).populate('offer')
      .skip(skip)
      .limit(limit)
      .lean();

      let cartCount = 0;
      if (cart && cart.items && cart.items.length > 0) {
         cart.items.forEach(item => {
         cartCount += item.quantity; 
      });
  } 
  
  let wishlistCount=0;
    if(wishlist){
      wishlistCount  = wishlist.items.length;
    }  
    
    res.render('user/menuPage', {
      user: user, 
      Category: Category,
      products: products,
      currentPage: page,
      totalPages: totalPages,
      cartCount,
      wishlistCount,
      offer,
      searchParams
    });
  } catch (error) {
    console.error('Error loading user home page:', error);
    res.status(500).send('An error occurred while loading the page');
  }
};

  const single_ProductView=async(req,res)=>{
    try {
      const { id } = req.params; 
      const Product = await product.findById(id).populate('category_id')
      const Category=await product.find({category_id:Product.category_id._id}) 
      res.render('user/single-product', { Product,Category});
    } catch (err) {
      console.error(err);
      res.redirect('/userHomePage');
    }
  }
  const search = async (req, res) => {
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const minPrice = req.query.min_price ? parseFloat(req.query.min_price) : 0;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price) : Infinity;
        const sort = req.query.sort || 'newest';

        let query = { 
          productname: { $regex: search, $options: 'i' },
          price: { $gte: minPrice, $lte: maxPrice }
        };

        let sortObj = {};
        switch(sort) {
          case 'name_asc':
            sortObj = { productname: 1 };
            break;
          case 'name_desc':
            sortObj = { productname: -1 };
            break;
          case 'price_asc':
            sortObj = { price: 1 };
            break;
          case 'price_desc':
            sortObj = { price: -1 };
            break;
          case 'newest':
          default:
            sortObj = { createdAt: -1 };
        }

        const products = await product.find(query)
          .populate('offer') 
          .sort(sortObj)
          .skip(skip)
          .limit(limit);
        const totalProducts = await product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        const Category = await category.find();
        const user = await User.findById(req.session.userId)
        const cart = await Cart.findOne({ user: user._id }).populate("items.product"); 
        let cartCount = 0;
        if (cart && cart.items) {
          cartCount = cart.items.length;
        }
        const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')
        let wishlistCount=0;
        if(wishlist){
          wishlistCount  = wishlist.items.length;
        }  
        res.render('user/menuPage', {
        user:user,
        products:products,

        currentPage: page,
        totalPages,
        Category: Category,
        cartCount:cartCount,
        wishlistCount:wishlistCount,
        
        searchParams: {
        search,
        minPrice,
        maxPrice,
        sort,
          }
        });
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
      }
    } 
  
  
  
  
  

  const logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  };



module.exports = {
    loadIndexPage,
    loadLogin,
    login,
    loadSignup,
    loadUserHomePage,
    signup,
    verifyOTP,
    resendOtp,
    logout,
    single_ProductView,
    otpPage,
    search
};
