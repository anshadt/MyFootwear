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
const InvoiceCounter = require('../../models/invoiceCounterModel');

async function generateInvoiceNumber() {
  try {
    console.log('first')
      const currentYear = new Date().getFullYear();
      let counter = await InvoiceCounter.findOne({ year: currentYear }).exec();
      console.log('first2')
      if (!counter) {
        console.log('first3')
          counter = new InvoiceCounter({ 
              year: currentYear,
              sequence: 0 
          });
      }
      console.log('first4')
      counter.sequence += 1;
      console.log('first5')
      await counter.save();
      console.log('first6')
    
      const invoiceNumber = `AFC-${currentYear}-${counter.sequence.toString().padStart(5, '0')}`;
      console.log('first7')
      return invoiceNumber;
  } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
  }
}



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


  
const loadUserHomePage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;
  const searchParams = {
    search: req.query.search || '',     
    minPrice: req.query.min_price || 0,  
    maxPrice: req.query.max_price || Infinity, 
    sort: req.query.sort || 'newest'     
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
      const Product = await product.findById(id).populate('category_id').populate('offer') 
      const Category=await product.find({category_id:Product.category_id._id}).populate('offer')
      const user = await User.findById(req.session.userId).lean();
      const cart = await Cart.findOne({ user: user._id }).populate("items.product");
      const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')

      let cartCount = 0;
        if (cart && cart.items && cart.items.length > 0) {
           cart.items.forEach(item => {
           cartCount += item.quantity; 
        });
    }

    let wishlistCount=0
    if(wishlist){
        wishlistCount=wishlist.items.length
    }

      res.render('user/single-product', { Product,Category,cartCount,wishlistCount,user});
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

    const loadForgot = async (req,res)=>{
      res.render('user/forgotPassword')
    }

    const post_ResetPage = async (req, res) => {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ error: 'No user with that email found.' });
      }
  
      
      const token = crypto.randomBytes(20).toString('hex');
      
  
     
      res.cookie('resetToken', token, {
          httpOnly: true,
          maxAge: 2 * 60 * 1000, 
          secure: false 
      });
      res.cookie('resetEmail', email, {
          httpOnly: true,
          maxAge: 2 * 60 * 1000, 
          secure: false 
      });
  
     
      const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: process.env.NODEMAILER_EMAIL,
              pass: process.env.NODEMAILER_PASSWORD
          }
      });
  
      // Email options
      const mailOptions = {
          to: user.email,
          from: process.env.NODEMAILER_EMAIL,
          subject: 'Password Reset',
          text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://localhost:3000/getRestPassword/${token}\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
  
      
      transporter.sendMail(mailOptions, (err) => {
          if (err) {
              console.error('Error sending email:', err);
              return res.status(500).json({ error: 'There was an error sending the email. Please try again.' });
          }
          return res.status(200).json({ success: true, message: 'Password reset email sent.' });
      });
  };
  
  
  
  const get_RestPassword = async (req, res) => {
      try {
          const { token } = req.params;
          const resetToken = req.cookies.resetToken;
          if (resetToken !== token) {
              return res.render('user/error'); 
          }
          
          res.render('user/changepwd');
      } catch (error) {
          console.error('Error in get_RestPassword:', error);
          res.status(500).send('An error occurred while processing your request.');
      }
  };
  
  
  const postResetPassword = async (req, res) => {
      try {
          const { newPassword } = req.body;
          const resetEmail = req.cookies.resetEmail;
          
          const user = await User.findOne({email:resetEmail});
          if (!user) {
              return res.json({success:false})
          }
      
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          user.password = hashedPassword;
      
          
          await user.save();
      res.json({success:true})
      } catch (error) {
         console.log(error) 
      }
      
  };

    const generateInvoice = async (req, res) => {
      try {
          const orderId = req.params.orderId;
          const order = await Order.findById(orderId)
              .populate('user')
              .populate('items.product')
              .populate('address');
  
          if (!order) {
              return res.status(404).send('Order not found');
          }
  
          
          if (!order.invoiceNumber) {
              order.invoiceNumber = await generateInvoiceNumber();
              await order.save();
          }
  
          
          const invoiceDir = path.join(__dirname, '../../public/invoices');
          if (!fs.existsSync(invoiceDir)){
              fs.mkdirSync(invoiceDir, { recursive: true });
          }
  
         
          const doc = new PDFDocument({
              size: 'A4',
              margin: 50,
              bufferPages: true 
          });
  
          const fileName = `invoice-${order.invoiceNumber}.pdf`;
          const filePath = path.join(invoiceDir, fileName);
  
         
          const pdfPromise = new Promise((resolve, reject) => {
              const writeStream = fs.createWriteStream(filePath);
              
              writeStream.on('error', reject);
              writeStream.on('finish', () => resolve(filePath));
              
              doc.pipe(writeStream);
  
              
              const addHeader = () => {
                  doc.image(path.join(__dirname, '../../public/images/iconshoe.jpg'), 50, 45, { width: 50 })
                     .fillColor('#444444')
                     .fontSize(24)
                     .text('Footwear', 110, 57)
                     .fontSize(10)
                     .text('Church Street', 450, 50, { align: 'right' })
                     .text('Bangalore, India', 450, 65, { align: 'right' })
                     .text('571250', 450, 80, { align: 'right' })     
                     .text('Phone: +91 9740446155', 450, 95, { align: 'right' })
                     .moveDown();
  
                  
                  doc.fillColor('#3498db')
                     .rect(50, 120, doc.page.width - 100, 3)
                     .fill();
  
                  
                  doc.fillColor('#444444')
                     .fontSize(20)
                     .text('INVOICE', 50, 140, { align: 'center' });
              };
  
              addHeader();
  
              const customerInformationTop = 180;
  
             
              doc.fontSize(12)
                 .font('Helvetica-Bold')
                 .text('BILL TO:', 50, customerInformationTop)
                 .fontSize(10)
                 .font('Helvetica')
                 .text(order.user.name, 50, customerInformationTop + 20)
                 .text(order.user.email, 50, customerInformationTop + 35);
  
             
              doc.fontSize(10)
                 .font('Helvetica-Bold')
                 .text('Invoice Number:', 350, customerInformationTop)
                 .font('Helvetica')
                 .text(order.invoiceNumber, 450, customerInformationTop)
                 .font('Helvetica-Bold')
                 .text('Order ID:', 350, customerInformationTop + 20)
                 .font('Helvetica')
                 .text(order.orderId, 450, customerInformationTop + 20)
                 .font('Helvetica-Bold')
                 .text('Date:', 350, customerInformationTop + 40)
                 .font('Helvetica')
                 .text(formatDate(order.createdAt), 450, customerInformationTop + 40)
                 .font('Helvetica-Bold')
                 .text('Payment Method:', 350, customerInformationTop + 60)
                 .font('Helvetica')
                 .text(order.paymentMethod, 450, customerInformationTop + 60);
  
              
              doc.fontSize(12)
                 .font('Helvetica-Bold')
                 .text('SHIPPING ADDRESS:', 50, customerInformationTop + 80)
                 .fontSize(10)
                 .font('Helvetica')
                 .text(order.address[0].fullName, 50, customerInformationTop + 100)
                 .text(order.address[0].streetAddress, 50, customerInformationTop + 115)
                 .text(`${order.address[0].city}, ${order.address[0].state}`, 50, customerInformationTop + 130)
                 .text(`PIN: ${order.address[0].zipCode}`, 50, customerInformationTop + 145)
                 .text(`Phone: ${order.address[0].phone}`, 50, customerInformationTop + 160);
  
             
              const tableTop = 380;
              let position = tableTop;
  
              
              function generateTableRow(doc, y, item, quantity, unitPrice, total) {
                  doc.fontSize(10)
                     .text(item, 50, y, { width: 250 })
                     .text(quantity, 300, y, { width: 90, align: 'center' })
                     .text(unitPrice, 390, y, { width: 90, align: 'right' })
                     .text(total, 480, y, { width: 70, align: 'right' });
              }
  
              
              doc.font('Helvetica-Bold')
                 .fillColor('#444444');
              generateTableRow(
                  doc,
                  position,
                  'Item Description',
                  'Quantity',
                  'Unit Price',
                  'Amount'
              );
  
              
              doc.strokeColor('#3498db')
                 .lineWidth(2)
                 .moveTo(50, position + 20)
                 .lineTo(550, position + 20)
                 .stroke();
  
              
              doc.font('Helvetica')
                 .strokeColor('#aaaaaa')
                 .lineWidth(1);
  
              position += 30;
              let total = 0;
  
              
              if (order.items.length > 10) {
                  
                  for (let i = 0; i < 10; i++) {
                      const item = order.items[i];
                      const itemTotal = item.price;
                      total += itemTotal;
  
                      generateTableRow(
                          doc,
                          position,
                          item.product.productname,
                          item.quantity,
                          `${item.price}`,
                          `${itemTotal}`
                      );
                      generateHr(doc, position + 20);
                      position += 30;
                  }
  
                 
                  doc.addPage();
                  addHeader();
                  position = 150; 
  
                  
                  doc.font('Helvetica-Bold');
                  generateTableRow(
                      doc,
                      position,
                      'Item',
                      'Quantity',
                      'Unit Price',
                      'Total'
                  );
                  generateHr(doc, position + 20);
                  doc.font('Helvetica');
                  position += 30;
  
                  
                  for (let i = 10; i < order.items.length; i++) {
                      const item = order.items[i];
                      const itemTotal = item.price;
                      total += itemTotal;
  
                      generateTableRow(
                          doc,
                          position,
                          item.product.productname,
                          item.quantity,
                          `${item.price/item.quantity}`,
                          `${itemTotal}`
                      );
                      generateHr(doc, position + 20);
                      position += 30;
                  }
              } else {
                 
                  order.items.forEach(item => {
                      const itemTotal = item.price;
                      total += itemTotal;
  
                      generateTableRow(
                          doc,
                          position,
                          item.product.productname,
                          item.quantity,
                          `${item.price/item.quantity}`,
                          `${itemTotal}`
                      );
                      generateHr(doc, position + 20);
                      position += 30;
                  });
              }
  
              
              const subtotalPosition = position + 30;
              
              
              doc.font('Helvetica-Bold');
              
              
              doc.text('Subtotal:', 350, subtotalPosition)
                 .text(`${total.toFixed(2)}`, 480, subtotalPosition, { align: 'right' });

                 const discount = order.discountAmount ? order.discountAmount.toFixed(2) : '0.00';
              doc.text('Discount:', 350, subtotalPosition + 20)
              .text(`-${discount}`, 480, subtotalPosition + 20, { align: 'right' });
               
              const deliveryCharge = 50;
              doc.text('Delivery Charge:', 350, subtotalPosition + 40)
             .text(`+${deliveryCharge.toFixed(2)}`, 480, subtotalPosition + 40, { align: 'right' });

              
              generateHr(doc, subtotalPosition + 60);
  
              doc.fontSize(12)
                 .text('Grand Total:', 350, subtotalPosition + 70)
                 .text(`${order.totalAmount.toFixed(2)}`, 480, subtotalPosition + 70, { align: 'right' });
  
              
              doc.font('Helvetica')
                 .fontSize(10)
                 .fillColor('#666666')
                 .text(
                     'We appreciate your trust in us. Looking forward to serving you again!',
                     50,
                     doc.page.height - 70,
                     { align: 'center', width: 500 }
                 )
              doc.end();
          });
  
          
          pdfPromise
              .then((filePath) => {
                  
                  res.setHeader('Content-Type', 'application/pdf');
                  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  
                 
                  const fileStream = fs.createReadStream(filePath);
                  fileStream.pipe(res);
  
                  
                  fileStream.on('end', () => {
                      fs.unlink(filePath, (err) => {
                          if (err) console.error('Error deleting file:', err);
                      });
                  });
              })
              .catch((error) => {
                  console.error('Error generating PDF:', error);
                  res.status(500).send('Error generating invoice');
              });
  
      } catch (error) {
          console.error('Error in invoice generation:', error);
          res.status(500).send('Error generating invoice');
      }
  };
  
  
  function generateHr(doc, y) {
      doc.strokeColor('#aaaaaa')
         .lineWidth(1)
         .moveTo(50, y)
         .lineTo(550, y)
         .stroke();
  }
  
  function formatDate(date) {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  
  function generateTableRow(doc, y, item, quantity, unitPrice, total) {
      doc.fontSize(10)
         .text(item, 50, y)
         .text(quantity, 280, y, { width: 90, align: 'center' })
         .text(unitPrice, 370, y, { width: 90, align: 'right' })
         .text(total, 0, y, { align: 'right' });
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
    search,
    loadForgot,
    post_ResetPage,
    get_RestPassword,
    postResetPassword,
    generateInvoice
};
