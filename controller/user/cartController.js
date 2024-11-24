const Category=require('../../models/categoryModel');
const Product=require('../../models/productModel');
const User = require('../../models/userModel'); 
const Address=require('../../models/addressModel')
const Cart=require('../../models/cartModel')
const mongoose = require('mongoose')
const Wishlist=require('../../models/wishlistModel')
const Order = require('../../models/orderModel');
const Coupon = require('../../models/couponModel');
const Wallet =require('../../models/walletModel') 


//Get Cart Page
const getCart_Page=async(req,res)=>{
  try {
     const user = await User.findById(req.session.userId).lean();
      const cart =await Cart.findOne({user:req.session.userId}).populate('items.product')
      let cartCount=0;
      if(cart){
         cartCount  = cart.items.length;
      }
      const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')
    let wishlistCount=0;
    if(wishlist){
      wishlistCount  = wishlist.items.length;
    }     
      res.render('user/cartPage',{cart,cartCount,wishlistCount,user})
  } catch (error) {
      console.error('Error fetching cart:', error); 
  res.status(500).send('Something went wrong!');
  }
}

//Post Add Cart Page
const postCart_Page = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const product = await Product.findById(productId);
    if(product.stock==0){
      return res.status(404).json({ success: false, message: "Not enough stock available" });
    }  
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      cart = new Cart({ user: user._id, items: [], total_price: 0 });
    }
    const existingItemIndex = cart.items.findIndex((item) => item.product.equals(productId));
    let actualPrice = product.discount_price ? product.discount_price : product.price
    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({ success: false, message: "Not enough stock available" });
      }
      if (newQuantity > 5) {
        return res.status(400).json({ success: false, message: "Maximum quantity reached" });
      }
      
      
      existingItem.quantity = newQuantity;
      existingItem.price = actualPrice * newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity: quantity,
        price:  actualPrice * quantity
      });
    }
    cart.total_price = cart.items.reduce((total, item) => total + item.price, 0);
    await cart.save();
    res.status(200).json({ success: true, message: "Product added to cart" ,});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.session.userId;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }
    cart.items.splice(itemIndex, 1);

    cart.total_price = cart.items.reduce((total, item) => total + item.price, 0);

    await cart.save();

    res.status(200).json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};


const updateCartItemQuantity = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.session.userId;
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    const cartItem = cart.items.find(item => item._id.toString() === itemId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }
    if (quantity > cartItem.product.stock) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }
    if(quantity<=0){
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }
    if (quantity > 5) {
      return res.status(400).json({ success: false, message: "Maximum quantity reached" });
    }

    const finalPrice = cartItem.product.discount_price 
        ? cartItem.product.discount_price 
        : cartItem.product.price - cartItem.product.discount_price; 

    
    cartItem.quantity = quantity;
    cartItem.price = finalPrice * quantity;

   
    cart.total_price = cart.items.reduce((total, item) => total + item.price, 0);


    await cart.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Cart item quantity updated",
      updatedItem: {
        id: cartItem._id,
        quantity: cartItem.quantity,
        price: cartItem.price
      },
      cartTotal: cart.total_price
    });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const checkOutPage= async(req,res)=>{
  try {
    const cart =await Cart.findOne({user:req.session.userId}).populate('items.product')
    const user = await User.findById(req.session.userId).lean();
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" })
    }
    let cartCount=0;
    if(cart){
       cartCount  = cart.items.length;
    }
    const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')
  let wishlistCount=0;
  if(wishlist){
    wishlistCount  = wishlist.items.length;
  }     
    const address = await Address.find({userId:req.session.userId});
    const currentDate = new Date();
        const availableCoupons = await Coupon.find({
            start_date: { $lte: currentDate },
            expiry_date: { $gte: currentDate },
            isDeleted: false,
            'users.userId': { $ne: user }
        }).lean();
        let charges = 50;
        let wallet = await Wallet.findOne({user: user._id})
    res.render('user/checkOutPage',{cart,address,wishlistCount,cartCount,user,availableCoupons,charges,wallet})
} catch (error) {
    console.error('Error fetching cart:', error); 
res.status(500).send('Something went wrong!');
}
}





const add_Address = async (req, res) => {
  try {
      const { fullName,streetAddress,phone,city,zipCode,state,country } = req.body;
      const { userId } = req.session
      if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
      }
      const newAddress = new Address({
          userId:userId,
          fullName,
          streetAddress,
          phone,
          city,
          zipCode,
          state,
          country
      });
      await newAddress.save();
      return res.status(201).json({ message: "Address added successfully",newAddress});
  } catch (error) {
      console.error('Error adding address:', error);
      return res.status(500).json({ message: "Server error", error: error.message });
  }
}

const edit_Address = async (req, res) => {
  try {
    const { addressId, fullName, streetAddress, phone, city, zipCode, state, country } = req.body;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { fullName, streetAddress, phone, city, zipCode, state, country },
      { new: true, runValidators: true }
    );

    if (updatedAddress) {
      res.status(200).json({ message: "Address updated successfully" });
    } else {
      res.status(404).json({ message: "Address not found" });
    }
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Something went wrong while editing the address' });
  }
};

const delete_Address=async(req,res)=>{
  try {
    const {id}=req.params;
    console.log(id);
    await Address.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: "something went wrong while deleting the address" });
  }
}


  




module.exports={
    getCart_Page,
    postCart_Page,
    removeCartItem ,
    updateCartItemQuantity,
    checkOutPage,
    add_Address,
    edit_Address,
    delete_Address,
   
}