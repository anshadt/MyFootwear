const Category=require('../../models/categoryModel');
const Product=require('../../models/productModel');
const User = require('../../models/userModel'); 
const Address=require('../../models/addressModel')
const Cart=require('../../models/cartModel')
const Order = require('../../models/orderModel');
const Coupon=require('../../models/couponModel')
const Razorpay=require('../../config/razorPay')
const crypto = require('crypto');
const Wishlist=require('../../models/wishlistModel')
const Wallet=require('../../models/walletModel')




/*const place_Order = async (req, res) => {
  try {
    
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { addressId, couponCode } = req.body;
    const userId = req.session.userId;
    
    let { paymentMethod } = req.body;
    const address = await Address.findById(addressId);

    const user = await User.findById(userId);
    paymentMethod = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer';

   
    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    
    for (const item of cart.items) {
      const product = item.product;
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success:false,
          message: `Insufficient stock for ${product.product_name}. Only ${product.stock} left in stock.`,
        });
      }
    }

  
    let totalAmount = cart.total_price;
    let discountAmount = 0;

    if (user.referralUsed && !user.hasUsedReferral) {
      discountAmount = (totalAmount * 15) / 100;
      totalAmount -= discountAmount;
      user.hasUsedReferral = true; // Mark as used
      user.referralUsed = true; // Ensure referralUsed is also updated
      await user.save(); // Save the user object with updated fields
    }
    

    if (couponCode) {
      const coupon = await Coupon.findOne({ coupon_code: couponCode, isDeleted: false });

      if (coupon) {
        const couponDiscount = (totalAmount * coupon.discount) / 100;
        totalAmount -= couponDiscount;
        discountAmount += couponDiscount;
      }
    }
   
    if(totalAmount > 1000){
      return res.json({success:false,message:'above 1000 is not allowed cash of delivery'})
    }
    

    const addressOrder = [
      {
        fullName: address.fullName,
        streetAddress: address.streetAddress,
        zipCode: address.zipCode,
        phone: address.phone,
        city: address.city,
        state: address.state,
        country: address.country,
      },
    ];
    
    

    
    const newOrderId = await generateOrderId();

  
    const newOrder = new Order({
      orderId: newOrderId,
      user: req.session.userId,
      address: addressOrder,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod: paymentMethod,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      orderStatus: 'Pending',
      orderStatusTimestamps: {
        pending: new Date(),
        
      },
    });
    user.hasUsedReferral = true;
    await newOrder.save();

    // Update product stock
    for (const item of cart.items) {
      const product = item.product;
      product.stock -= item.quantity;
      await product.save();
    }

    // Clear the user's cart after placing the order
    await Cart.deleteOne({ user: req.session.userId });

    // Send the response
    res.status(201).json({
      success:true,
      message: "Order placed successfully",
      order: newOrder,
      discountAmount: discountAmount > 0 ? `Discount Applied: ₹${discountAmount}` : "No Discount",
      couponDiscount: couponDiscount > 0 ? `Discount Applied: ₹${couponDiscount}` : "No coupon",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Helper function to generate a new order ID
let orderCounter = 1;
const generateOrderId = async () => {
  const prefix = "ORD";
  const latestOrder = await Order.findOne()
    .sort({ orderId: -1 })
    .select("orderId");
  const latestId = latestOrder
    ? parseInt(latestOrder.orderId.replace(prefix, ""))
    : 0;
  const newId = latestId + 1;
  return `${prefix}${newId.toString().padStart(5, "0")}`;
};*/




const place_Order = async (req, res) => {
  try {
    console.log('place')
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { addressId, couponCode } = req.body;
    let { paymentMethod } = req.body;
    const address = await Address.findById(addressId);

  console.log('place2')
    paymentMethod = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer';

   
    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    
    for (const item of cart.items) {
      const product = item.product;
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success:false,
          message: `Insufficient stock for ${product.product_name}. Only ${product.stock} left in stock.`,
        });
      }
    }

  
    let totalAmount = cart.total_price;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ coupon_code: couponCode, isDeleted: false });

      if (coupon) {
        discountAmount = (totalAmount * coupon.discount) / 100;
        totalAmount -= discountAmount;
      }
    }
   
    if(totalAmount > 10000){
      return res.json({success:false,message:'above 1000 is not allowed cash on delivery'})
    }
    

    const addressOrder = [
      {
        fullName: address.fullName,
        streetAddress: address.streetAddress,
        zipCode: address.zipCode,
        phone: address.phone,
        city: address.city,
        state: address.state,
        country: address.country,
      },
    ];
    
    

    
    const newOrderId = await generateOrderId();

  
    const newOrder = new Order({
      orderId: newOrderId,
      user: req.session.userId,
      address: addressOrder,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod: paymentMethod,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      orderStatus: 'Pending',
      orderStatusTimestamps: {
        pending: new Date(),
      },
    });

    await newOrder.save();

    // Update product stock
    for (const item of cart.items) {
      const product = item.product;
      product.stock -= item.quantity;
      await product.save();
    }

    // Clear the user's cart after placing the order
    await Cart.deleteOne({ user: req.session.userId });

    // Send the response
    res.status(201).json({
      success:true,
      message: "Order placed successfully",
      order: newOrder,
      discountAmount: discountAmount > 0 ? `Discount Applied: ₹${discountAmount}` : "No Discount",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Helper function to generate a new order ID
let orderCounter = 1;
const generateOrderId = async () => {
  const prefix = "ORD";
  const latestOrder = await Order.findOne()
    .sort({ orderId: -1 })
    .select("orderId");
  const latestId = latestOrder
    ? parseInt(latestOrder.orderId.replace(prefix, ""))
    : 0;
  const newId = latestId + 1;
  return `${prefix}${newId.toString().padStart(5, "0")}`;
};





const getOrderHistory = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 6
  const skip = (page-1)*limit
  try {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const wishlist =await Wishlist.findOne({user:req.session.userId}).populate('items.product')
  let wishlistCount=0;
  if(wishlist){
    wishlistCount  = wishlist.items.length;
  }  
    const user = await User.findOne({ _id: req.session.userId }); 
    const cart = await Cart.findOne({ user: user._id }).populate("items.product");
    const [orders,totalOrders] = await Promise.all([Order.find({user:userId}).populate('items.product').sort({ createdAt: -1 }).skip(skip).limit(limit),Order.countDocuments()])
    totalPages = Math.ceil(totalOrders/limit)

    //const orders = await Order.find({ user: userId })
        // .populate('items.product')
        // .sort({ createdAt: -1 });

        let cartCount = 0;
    if (cart && cart.items && cart.items.length > 0) {
       cart.items.forEach(item => {
       cartCount += item.quantity; 
    });
}   
    res.render('user/orderHistory', { orders,user, cartCount,wishlistCount,currentPage:page,totalPages,limit });
} catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Internal Server Error' });
}
};



const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const order = await Order.findOne({ orderId, user: userId });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    if (order.orderStatus === 'Cancelled') {
        return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
        return res.status(400).json({ message: "Cannot cancel order at this stage" });
    }

    order.orderStatus = 'Cancelled';
    order.orderStatusTimestamps.cancelled = new Date();

    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
        });
    }
    if (order.paymentStatus === "Paid") {
      const refund = order.totalAmount;
      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        wallet = new Wallet({
          user: order.user,
          balanceAmount: 0,
          wallet_history: [],
        });
      }
      wallet.balanceAmount += refund;
      wallet.wallet_history.push({
        date: new Date(),
        amount: refund,
        description: `Refund for cancelled item (Order ID: ${order.orderId})`,
        transactionType: "credited",
      });
      await wallet.save();
    }

    await order.save();

    res.status(200).json({ message: "Order cancelled successfully" });
} catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal Server Error" });
}
};


const getOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, status: order.orderStatus });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order status' });
    }
};

// const razor_PayOrderCreate = async (req, res) => {
  
//   try {
//     console.log(req.session.userId);
//     if (!req.session.userId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }
//     const { addressId, couponCode, paymentMethod } = req.body;
//     console.log(addressId, paymentMethod, couponCode);
//     const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
//     console.log(cart);
//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: 'Cart is empty' });
//     }
//     for (const item of cart.items) {
//       const product = item.product;
//       if (product.stock < item.quantity) {

//         return res.status(400).json({
//           success: false,
//           message: `Insufficient stock for ${product.product_name}. Only ${product.stock} left in stock.`,
//         });
//       }
//     }
//     let totalAmount = cart.total_price;
//     let discountAmount = 0;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ coupon_code: couponCode, isDeleted: false });
//       if (coupon) {
//         discountAmount = (totalAmount * coupon.discount) / 100;
//         totalAmount -= discountAmount;
//       }
//     }
//     const options = {
//       amount: Math.round(totalAmount * 100),
//       currency: 'INR',
//       receipt: `receipt#${totalAmount+'Anshad'}`,
//       payment_capture: 1,
//     };

//     const razorpayOrder = await Razorpay.orders.create(options);
//     return res.json({
//       success: true,
//       razorpayOrder,
//       totalAmount,
//       discountAmount,
//       payableAmount: totalAmount*100,
//     });
//   } catch (error) {
//     console.error('Error creating Razorpay order:', error);
//     return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });
//   }
// };

// Razorpay Payment Verification



const razor_PayOrderCreate = async (req, res) => {

  try {
    console.log(req.session.userId);
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { addressId, couponCode, paymentMethod } = req.body;
    console.log(addressId, paymentMethod, couponCode);
    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    console.log(cart);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    for (const item of cart.items) {
      const product = item.product;
      if (product.stock < item.quantity) {

        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.product_name}. Only ${product.stock} left in stock.`,
        });
      }
    }
    let totalAmount = cart.total_price;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ coupon_code: couponCode, isDeleted: false });
      if (coupon) {
        discountAmount = (totalAmount * coupon.discount) / 100;
        totalAmount -= discountAmount;
      }
    }
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `receipt#${totalAmount+'Anshad'}`,
      payment_capture: 1,
    };

    const razorpayOrder = await Razorpay.orders.create(options);
    return res.json({
      success: true,
      razorpayOrder,
      totalAmount,
      discountAmount,
      payableAmount: totalAmount*100,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });
  }
};


// const razorPay_payment = async (req, res) => {
//   try {
    
    
//     const { payment_id, order_id, signature, addressId, couponCode, paymentMethod } = req.body;
//     const address = await Address.findById(addressId);
//     if (!req.session.userId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }

//     const userId = req.session.userId;
//     const user = await User.findById(userId);
    
//     const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');


//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: 'Cart is empty' });
//     }

  
//     let totalAmount = cart.total_price;
//     let discountAmount = 0;
//     if (user.referralUsed && !user.hasUsedReferral) {
//       discountAmount = (totalAmount * 15) / 100;
//       totalAmount -= discountAmount;
//       user.hasUsedReferral = true; // Update to mark referral discount as used
//       await User.save();
//     }
//     if (couponCode) {
//       const coupon = await Coupon.findOne({ coupon_code: couponCode, isDeleted: false });
//       if (coupon) {
//         discountAmount = (totalAmount * coupon.discount) / 100;
//         totalAmount -= discountAmount;
//       }
//     }

//     const addressOrder = [
//       {
//         fullName: address.fullName,
//         streetAddress: address.streetAddress,
//         zipCode: address.zipCode,
//         phone: address.phone,
//         city: address.city,
//         state: address.state,
//         country: address.country,
//       },
//     ];
//     const newOrderId = await generateOrderId();


//     const body = `${order_id}|${payment_id}`;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
//       .update(body)
//       .digest('hex');
  

   
//     const paymentVerified = expectedSignature === signature;

    
//     const newOrder = new Order({

//       orderId: newOrderId,
//       user: req.session.userId,
//       address: addressOrder,
//       items: cart.items.map((item) => ({
//         product: item.product._id,
//         quantity: item.quantity,
//         price: item.price,
        
//       })),
//       paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer',
//       totalAmount: totalAmount,
//       discountAmount: discountAmount,
//       paymentStatus: paymentVerified ? 'Paid' : 'Failed',
//       orderStatusTimestamps: {
//         pending: new Date(),
//       },
//     });
    
 
//     for (const item of cart.items) {
//       const product = item.product;
//       product.stock -= item.quantity;
//       await product.save();
//     }
    
//     await newOrder.save();

//     await Cart.deleteOne({ user: req.session.userId });
  
//     if (paymentVerified) {
//       return res.json({
//         success: true,
//         message: 'Payment verified and order created successfully',
//         order: newOrder,
//       });
//     } else {
//       return res.json({
//         success: false,
//         message: 'Payment verification failed. Order created but payment failed',
//         order: newOrder,
//       });
//     }
//   } catch (error) {
//     console.error('Error in Razorpay payment:', error);
//     return res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// };



const razorPay_payment = async (req, res) => {
  try {
    
    
    const { payment_id, order_id, signature, addressId, couponCode, paymentMethod } = req.body;
    const address = await Address.findById(addressId);
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }


    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');


    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

  
    let totalAmount = cart.total_price;
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ coupon_code: couponCode, isDeleted: false });
      if (coupon) {
        discountAmount = (totalAmount * coupon.discount) / 100;
        totalAmount -= discountAmount;
      }
    }

    const addressOrder = [
      {
        fullName: address.fullName,
        streetAddress: address.streetAddress,
        zipCode: address.zipCode,
        phone: address.phone,
        city: address.city,
        state: address.state,
        country: address.country,
      },
    ];
    const newOrderId = await generateOrderId();


    const body = `${order_id}|${payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
      .update(body)
      .digest('hex');
  

   
    const paymentVerified = expectedSignature === signature;

    
    const newOrder = new Order({

      orderId: newOrderId,
      user: req.session.userId,
      address: addressOrder,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer',
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      paymentStatus: paymentVerified ? 'Paid' : 'Failed',
      orderStatusTimestamps: {
        pending: new Date(),
      },
    });
    
 
    for (const item of cart.items) {
      const product = item.product;
      product.stock -= item.quantity;
      await product.save();
    }
    await newOrder.save();

    await Cart.deleteOne({ user: req.session.userId });
  
    if (paymentVerified) {
      return res.json({
        success: true,
        message: 'Payment verified and order created successfully',
        order: newOrder,
      });
    } else {
      return res.json({
        success: false,
        message: 'Payment verification failed. Order created but payment failed',
        order: newOrder,
      });
    }
  } catch (error) {
    console.error('Error in Razorpay payment:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};




module.exports ={
  place_Order,
  getOrderHistory,
  cancelOrder,
  getOrderStatus,
  razor_PayOrderCreate,
  razorPay_payment
}

