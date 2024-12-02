const express=require('express');
const nodemailer = require('nodemailer'); 
const env=require('dotenv').config(); 
const adminRouter=express.Router();
const adminController=require('../controller/admin/adminController')
const categoryController=require('../controller/admin/categoryController')
const productController=require('../controller/admin/productController')
const orderController=require('../controller/admin/orderController')
const adminAuth=require('../middlewares/adminAuth')
// const { uploads } = require('../config/cloudinary');
const upload=require('../config/multer')
//const upload=require('../config/multer')
//const { cloudinaryUploads } = require('../config/cloudinary');
const salesController=require('../controller/admin/salesController')
const offerController=require('../controller/admin/offerController')
const couponController=require('../controller/admin/couponController')

//Admin DashBoard
adminRouter.get('/login',adminController.load_AdminPage);
adminRouter.get('/loadAdminDash',adminController.load_AdminDash);
adminRouter.get('/salesReport',salesController.load_SalesReport);
adminRouter.post('/adminPage',adminController.admin_Dashboard);
adminRouter.get('/loaduserMng',adminController.load_userMng);
adminRouter.get('/logout',adminController.logout);
adminRouter.get('/block-user/:id',adminController.block_user);
adminRouter.get('/unblock-user/:id',adminController.unblock_user);

//Category Management
adminRouter.get('/categoryPage',categoryController.load_CategoryPage);
adminRouter.post('/addCategory',categoryController.add_Category);
adminRouter.put('/editCategory/:id',categoryController.edit_Category);
adminRouter.put('/deleteCategory/:id',categoryController.delete_Category);
adminRouter.put('/restoreCategory/:id',categoryController.restore_Category);

//Product Management
adminRouter.get('/loadProuctPage',productController.load_ProuctPage);
adminRouter.get('/addProuctPage',productController.addProuct_Page)
adminRouter.post('/addProduct',adminAuth,upload.any(),productController.add_Product);
adminRouter.get('/editProductPage/:id',productController.loadEditProductPage);
adminRouter.post('/editProduct/:id', adminAuth,upload.any(),productController.editProduct);


adminRouter.put('/deleteProduct/:productId',productController.delete_Product);
adminRouter.put('/restoreProduct/:productId',productController.restore_Product)

//Order Management
adminRouter.get('/loardOrderMng',adminAuth,orderController.loard_OrderMng)
adminRouter.get('/orders/:id', adminAuth,orderController.getOrderDetails);
adminRouter.post('/update-status',adminAuth,orderController.updateOrderStatus);

//Coupon Management
adminRouter.get('/loadCouponPage',adminAuth,couponController.load_CouponPage)
adminRouter.post('/addCoupon',adminAuth,couponController.add_Coupon)
adminRouter.post('/editCoupon',adminAuth,couponController.edit_Coupon)
adminRouter.post('/cancel-coupon', couponController.cancel_Coupon);



//Sales Report Section 
adminRouter.post('/generateSalesReport',adminAuth,salesController.generateSalesReport)
// router.post('/generatePDFReport', adminAuth, salesController.generatePDFReport);
// router.post('/generateExcelReport', adminAuth, salesController.generateExcelReport);
adminRouter.get('/salesChart',adminAuth,salesController.sales_Chart)

//Offer Section 
adminRouter.get('/offer',adminAuth,offerController.offer)
adminRouter.post('/addOfferProduct',adminAuth,offerController.addOffer_Product)
adminRouter.post('/editOffer',adminAuth,offerController.edit_Offer)
adminRouter.put('/deleteOffer/:id',adminAuth,offerController.delete_Offer);
adminRouter.put('/restoreOffer/:id',adminAuth,offerController.restore_Offer);
adminRouter.post('/updateProductOffer',adminAuth,offerController.update_ProductOffer)
adminRouter.post('/updateCategoryOffer',adminAuth,offerController.update_CategoryOffer)










module.exports=adminRouter;