const category=require('../../models/categoryModel');
const product=require('../../models/productModel');
const User = require('../../models/userModel'); 
const Address=require('../../models/addressModel')
const Cart=require('../../models/cartModel')
const bcrypt = require('bcrypt')
const Wishlist=require('../../models/wishlistModel')


const profile_Page = async (req, res) => {
    try {
      const address = await Address.find({ userId: req.session.userId });
      const user = await User.findOne({ _id: req.session.userId }); 
      const cart = await Cart.findOne({ user: user._id }).populate("items.product"); 
      const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')
      let wishlistCount=0;
      if(wishlist){
        wishlistCount  = wishlist.items.length;
      }  
      let cartCount = 0;
     if (cart && cart.items && cart.items.length > 0) {
        cart.items.forEach(item => {
        cartCount += item.quantity; 
     });
}
      res.render('user/profilePage', { address, user, cartCount,wishlistCount });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  const edit_Profile = async (req, res) => {
    try {
        const { userId, editUserName } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid User.' });
        }

        if (editUserName === user.name) {
            return res.status(400).json({
                success: false,
                message: 'Current username and new username are the same.',
            });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { name: editUserName }, { new: true });
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            updatedUser
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            message: 'An error occurred while updating the profile.',
        });
    }
};
const change_Password=async(req,res)=>{
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findOne({ email:req.session.email });
        if(!user){
            return res.status(400).json({success:false, message: 'Invalid User name.' });
        }
        const isEaqual = await bcrypt.compare(newPassword, user.password);
        if (isEaqual) {
            return res.status(400).json({success:false, message: 'Current password and new password are the same.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: 'Password changed successfully!' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'An error occurred while changing the password.' });
    }
};






module.exports={
    profile_Page,
    edit_Profile,
    change_Password
}