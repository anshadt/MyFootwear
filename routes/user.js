const express=require('express');
const userRouter=express.Router();
const user= require('../models/userModel');
const userController=require('../controller/user/userController');
const profileController=require('../controller/user/profileController')
const cartController=require('../controller/user/cartController')
const orderController=require('../controller/user/orderController')
const userAuth=require('../middlewares/userAuth');
const isBlockAuth=require('../middlewares/isBlockAuth')
const couponController=require('../controller/user/couponController')
const wishlistController=require('../controller/user/wishlistController');
const { whitelist } = require('validator');
const walletController=require('../controller/user/walletController')


userRouter.use(isBlockAuth)
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
userRouter.get('/userHomePage',userAuth,userController.loadUserHomePage )
userRouter.get('/logout',userController.logout)
userRouter.get('/search',userAuth,userController.search);

//Single ProductView Page
userRouter.get('/user/singleProductView/:id',userAuth,userController.single_ProductView);

userRouter.get('/profilePage',userAuth,profileController.profile_Page);
userRouter.post('/editProfile',userAuth,profileController.edit_Profile)
userRouter.post('/changepassword',userAuth,profileController.change_Password)



userRouter.get('/getCartPage',isBlockAuth,userAuth,cartController.getCart_Page)
userRouter.post('/postCartPage',isBlockAuth,userAuth,cartController.postCart_Page)
//userRouter.post('/applyReferralCode', isBlockAuth, userAuth, cartController.applyReferralCode);
userRouter.post('/remove-cart-item',userAuth, cartController.removeCartItem);
userRouter.post('/update-cart-quantity', cartController.updateCartItemQuantity);
userRouter.get('/checkOutPage',userAuth,cartController.checkOutPage)
userRouter.post('/addAddress',userAuth,cartController.add_Address);
userRouter.post('/editAddress',userAuth,cartController.edit_Address);
userRouter.delete('/deleteAddress/:id',userAuth,cartController.delete_Address)
userRouter.post('/placeOrder',userAuth,orderController.place_Order);
userRouter.get('/orderHistory',userAuth,orderController.getOrderHistory);
userRouter.post('/orders/:orderId',userAuth,orderController.cancelOrder);
userRouter.get('/order-status/:orderId',userAuth,orderController.getOrderStatus);


//Coupon section
userRouter.post('/apply-coupon', couponController.applyCoupon);
userRouter.post('/remove-coupon', couponController.removeCoupon);

//Razor Pay Section
userRouter.post('/razor-Pay-OrderCreate',userAuth,orderController.razor_PayOrderCreate)
userRouter.post('/razor-Pay-Payment',userAuth,orderController.razorPay_payment)

//Wish List Section
userRouter.get('/wishlist',userAuth,wishlistController.loadWishlist)
userRouter.post('/addWishlist',userAuth,wishlistController.add_Wishlist)
userRouter.post('/remove-Wishlist-Item',userAuth,wishlistController.remove_WishlistItem)

userRouter.get('/loadWalletPage',userAuth,walletController.load_walletPage)
userRouter.post('/addFund',walletController.addFund)
userRouter.post('/verifyPayment',walletController.verifyPayment)












module.exports=userRouter;