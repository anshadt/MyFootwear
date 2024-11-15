const User=require('../../models/userModel')
const Coupon=require('../../models/couponModel')


// Coupon Load Page
const load_CouponPage=async(req,res)=>{
    try {
        const coupon=await Coupon.find()
        res.render('admin/couponMng',{coupon,title:"Coupon Management"})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }   
}

//// Add Coupon Load Page
const add_Coupon = async (req, res) => {
    try {
        const { coupon_code, description, start_date, expiry_date, discount_percentage, min_amount, max_amount } = req.body;
        const existingCoupon = await Coupon.findOne({
            coupon_code: { $regex: new RegExp(`^${coupon_code}$`, "i") },
        });
        if (existingCoupon) {
            return res.json({ success: false, error: "Coupon with this code already exists." });
        }
        if (!coupon_code) {
            return res.json({ success: false, error: 'Coupon code is empty.' });
        }
        if (!discount_percentage || isNaN(discount_percentage)) {
            return res.json({ success: false, error: 'Discount must be a valid number.' });
        }
        if (discount_percentage < 1 || discount_percentage > 100) {
            return res.json({ success: false, error: 'Discount must be between 1 and 100.' });
        }
        if (discount_percentage !== Math.floor(discount_percentage)) {
            return res.json({ success: false, error: 'Discount must be a whole number.' });
        }
        const currentDate = new Date();
        if (!start_date) {
            return res.json({ success: false, error: 'Start date is required.' });
        }
        if (start_date < currentDate) {
            return res.json({ success: false, error: 'Start date is empty or cannot be in the past.' });
        }
        if (!expiry_date) {
            return res.json({ success: false, error: 'Expiry date is required.' });
        }

        if (expiry_date <= start_date) {
            return res.json({ success: false, error: 'Expiry date must be later than the start date.' });
        }
        if (!min_amount || isNaN(min_amount) || parseInt(min_amount) <= 0) {
            return res.json({ success: false, error: 'Minimum amount must be a valid number greater than zero.' });
        }
        if (!max_amount || isNaN(max_amount) || parseInt(max_amount) <= 0) {
            return res.json({ success: false, error: 'Maximum amount must be a valid number greater than zero.' });
        }
        if (!description) {
            return res.json({ success: false, error: 'Coupon description is empty.' });
        }

        const newCoupon = new Coupon({
            coupon_code:coupon_code,
            discount:discount_percentage,
            start_date:start_date,
            expiry_date:expiry_date,
            min_purchase_amount:min_amount,
            max_coupon_amount:max_amount,
            coupon_description:description
        });

        await newCoupon.save();

        return res.json({ success: true, message: 'Coupon successfully added.' });

    } catch (error) {
        console.error("Error while adding new coupon:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }

        return res.status(500).json({ success: false, error: "Something went wrong while adding the coupon." });
    }
};


// Edit Coupon
const edit_Coupon= async (req,res)=>{
    try {
        const {coupon_Id,coupon_code,description,start_date,expiry_date,discount_percentage,min_amount,max_amount}=req.body;
        if(!coupon_code){
            return res.json({success:false,error:'coupon code is empty'})
        }
        if(!description){
            return res.json({success:false,error:'couponDescription is empty'})
        }
        if(!expiry_date){
            return res.json({success:false,error:'coupon Expiry Date is empty'})
        }
        if (expiry_date <= start_date) {
          return res.json({success:false,error:'End date must be after the start date.'})
          }
        if(!start_date){
            return res.json({success:false,error:'coupon start Date is empty'})
        }
        const currentDate = new Date()

        if (start_date < currentDate) {
            return res.json({success:false,error:'Start date cannot be in the past'})
        }

        if(!discount_percentage){
            return res.json({success:false,error:'coupon discount is empty'})
        }
        let discountValue = parseInt(discount_percentage);
        if (isNaN(discountValue)) {      
            return res.json({success:false,error:'discount must be a number.'})
        }

        if (discountValue < 1 || discountValue > 100) {
            return res.json({success:false,error:'discount not more than 100 and less than 0'})
        }
        if (discountValue !== Math.floor(discountValue)) {
            return res.json({ success: false, error: 'Discount must be a whole number.' });
        }

        if(!min_amount){
            return res.json({success:false,error:'coupon minAmount is empty'})
        }
        if (isNaN(min_amount)) {
            return res.json({success:false,error:'Min Amount must be a number.'})
          }
          if (parseInt(min_amount) === 0) {
             return res.json({success:false,error:'Min Amount cannot be zero.'})
          }

          if(!max_amount){
            return res.json({success:false,error:'coupon maxAmount is empty'})
        }
        if (isNaN(max_amount)) {
            return res.json({success:false,error:'Max Amount must be a number.'})
          }
          if (parseInt(max_amount) === 0) {
             return res.json({success:false,error:'Max Amount cannot be zero.'})
          }

          await Coupon.findByIdAndUpdate(coupon_Id,{
            
            coupon_code:coupon_code,
            discount:discountValue,
            start_date:new Date(start_date),
            exipry_date:new Date(expiry_date),
            min_purchase_amount:min_amount,
            max_coupon_amount:max_amount,
            coupon_description:description
         })
         res.json({success:true,message:'coupon edited successfully'})
    } catch (error) {
        console.error("Error while updating the coupon:", error);
        return res.status(500).json({ success: false, error: 'Something went wrong while updating the coupon' });
    }
}

// Cancel/Delete Coupon
const cancel_Coupon = async (req, res) => {
    try {
        const { coupon_Id } = req.body;

        if (!coupon_Id) {
            return res.json({ success: false, error: 'Coupon ID is required' });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(coupon_Id, { isDeleted: true }, { new: true });

        if (!updatedCoupon) {
            return res.json({ success: false, error: 'Coupon not found' });
        }

        res.json({ success: true, message: 'Coupon successfully cancelled/deleted' });
    } catch (error) {
        console.error("Error while cancelling/deleting coupon:", error);
        return res.status(500).json({ success: false, error: 'Something went wrong while cancelling/deleting the coupon' });
    }
};

module.exports = {
    load_CouponPage,
    add_Coupon,
    edit_Coupon,
    cancel_Coupon
}
