const mongoose = require('mongoose');
const Product=require('../../models/productModel');
const User = require('../../models/userModel');
const Wishlist=require('../../models/wishlistModel')
const Cart=require('../../models/cartModel')


//Load Wishlist section
const loadWishlist=async(req,res)=>{
  try {
    const user = await User.findById(req.session.userId).lean();
    const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')
    let wishlistCount=0;
    if(wishlist){
      wishlistCount  = wishlist.items.length;
    }  
    const cart =await Cart.findOne({user:req.session.userId}).populate('items.product')
      let cartCount=0;
      if(cart){
         cartCount  = cart.items.length;
      }
    res.render('user/whishlist',{wishlist,wishlistCount,cartCount,user})
} catch (error) {
    console.error('Error fetching wishlist:', error); 
    res.status(500).send('Something went wrong!');
}
  }
  
  //Add Wishlist Section
  const add_Wishlist = async (req, res) => {
    try {
      const { productId } = req.body; 
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      let wishlist = await Wishlist.findOne({ user: user._id });
      if (!wishlist) {
        wishlist = new Wishlist({ user: user._id, items: [] });
      }
      const existingItemIndex = wishlist.items.findIndex((item) => item.product.equals(productId));
      if (existingItemIndex > -1) {
        return res.status(400).json({ success: false, message: "Product already in wishlist" });
      }
      wishlist.items.push({
        product: productId,
        quantity: 1  
      });
      await wishlist.save();
      res.status(200).json({ success: true, message: "Product added to wishlist" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Something went wrong!" });
    }
  };
  
//Remove Wishlist
  const remove_WishlistItem = async (req, res) => {
    try {
      const { itemId } = req.body;
      const userId = req.session.userId;
      const wishlist = await Wishlist.findOne({ user: userId });
      if (!wishlist) {
        return res.status(404).json({ success: false, message: "Wishlist not found" });
      }
  
      const itemIndex = wishlist.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: "Item not found in wishlist" });
      }
      wishlist.items.splice(itemIndex, 1);
  
      await wishlist.save();
  
      res.status(200).json({ success: true, message: "Item removed from wishlist" });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).json({ success: false, message: "Something went wrong!" });
    }
  };

  module.exports = {
    loadWishlist,
    add_Wishlist,
    remove_WishlistItem
  }