const express=require('express');
const userRouter=express.Router();
const user= require('../models/userModel');
const userController=require('../controller/user/userController');
const profileController=require('../controller/user/profileController')
const cartController=require('../controller/user/cartController')
const orderController=require('../controller/user/orderController')
const userAuthentication=require('../middlewares/userAuth');
const isBlockAuth=require('../middlewares/isBlockAuth')
const couponController=require('../controller/user/couponController')
const wishlistController=require('../controller/user/wishlistController');
const { whitelist } = require('validator');
const walletController=require('../controller/user/walletController')




//Index Page Loading
userRouter.get('/',userController.loadIndexPage);
userRouter.get('/login',userController.loadLogin);

//User Loging && Signup pages
userRouter.post('/login',userController.login);
userRouter.get('/signup',userController.loadSignup);
userRouter.post('/signup',userController.signup);

//OTP Pages
userRouter.get('/otpPage',userController.otpPage);
userRouter.post('/verify-OTP',userController.verifyOTP)
userRouter.post('/resend-OTP', userController.resendOtp);

//User Home Page && Logout
userRouter.get('/userHomePage',isBlockAuth,userAuthentication,userController.loadUserHomePage )
userRouter.get('/logout',userController.logout)
userRouter.get('/search',isBlockAuth,userAuthentication,userController.search);

userRouter.get('/forgotPassword',userController.loadForgot)
userRouter.post('/postResetPage',userController.post_ResetPage);
userRouter.get('/getRestPassword/:token',userController.get_RestPassword)
userRouter.post('/reset-password', userController.postResetPassword);


//Single ProductView Page
userRouter.get('/user/singleProductView/:id',isBlockAuth,userAuthentication,userController.single_ProductView);

userRouter.get('/profilePage',isBlockAuth,userAuthentication,profileController.profile_Page);
userRouter.post('/editProfile',isBlockAuth,userAuthentication,profileController.edit_Profile)
userRouter.post('/changepassword',isBlockAuth,userAuthentication,profileController.change_Password)



userRouter.get('/getCartPage',isBlockAuth,userAuthentication,cartController.getCart_Page)
userRouter.post('/postCartPage',isBlockAuth,userAuthentication,cartController.postCart_Page)
//userRouter.post('/applyReferralCode', isBlockAuth, userAuthentication, cartController.applyReferralCode);
userRouter.post('/remove-cart-item',isBlockAuth,userAuthentication, cartController.removeCartItem);
userRouter.post('/update-cart-quantity',isBlockAuth, cartController.updateCartItemQuantity);
userRouter.get('/checkOutPage',isBlockAuth,userAuthentication,cartController.checkOutPage)
userRouter.post('/addAddress',isBlockAuth,userAuthentication,cartController.add_Address);
userRouter.post('/editAddress',isBlockAuth,userAuthentication,cartController.edit_Address);
userRouter.delete('/deleteAddress/:id',isBlockAuth,userAuthentication,cartController.delete_Address)
userRouter.post('/placeOrder',isBlockAuth,userAuthentication,orderController.place_Order);


userRouter.get('/orderHistory',isBlockAuth,userAuthentication,orderController.getOrderHistory);
userRouter.post('/orders/:orderId',isBlockAuth,userAuthentication,orderController.cancelOrder);
userRouter.get('/order-status/:orderId',isBlockAuth,userAuthentication,orderController.getOrderStatus);
userRouter.post('/return-order',isBlockAuth, userAuthentication,orderController.returnOrder)




//Coupon section
userRouter.post('/apply-coupon', couponController.applyCoupon);
userRouter.post('/remove-coupon', couponController.removeCoupon);

//Razor Pay Section
userRouter.post('/razor-Pay-OrderCreate',isBlockAuth,userAuthentication,orderController.razor_PayOrderCreate)
userRouter.post('/Wallet-Pay-OrderCreate',isBlockAuth,userAuthentication,orderController.wallet_PayOrderCreate)
userRouter.post('/razor-Pay-Payment',isBlockAuth,userAuthentication,orderController.razorPay_payment)
userRouter.post('/repaymentRazorpay',isBlockAuth,orderController.repayment_Razorpay)
userRouter.post('/verifyRepayment',isBlockAuth,orderController.verify_Repayment)
userRouter.post('/orderWallet',isBlockAuth,userAuthentication,walletController.Order_Wallet)



//Wish List Section
userRouter.get('/wishlist',isBlockAuth,userAuthentication,wishlistController.loadWishlist)
userRouter.post('/addWishlist',isBlockAuth,userAuthentication,wishlistController.add_Wishlist)
userRouter.post('/remove-Wishlist-Item',userAuthentication,wishlistController.remove_WishlistItem)

userRouter.get('/loadWalletPage',isBlockAuth,userAuthentication,walletController.load_walletPage)
userRouter.post('/addFund',isBlockAuth,walletController.addFund)
userRouter.post('/verifyPayment',isBlockAuth,walletController.verifyPayment)

userRouter.get('/invoice/:orderId',isBlockAuth, userAuthentication, userController.generateInvoice);













module.exports=userRouter;