const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    address:[{

        fullName:{
            type:String,
            required:true
        },
        streetAddress:{
            type:String,
            required:true
        },
        zipCode:{
            type:String,
            required:true
        },
        phone:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        },
    }],
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash on Delivery', 'Bank Transfer','Wallet']
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderStatus: {
        type: String,
        required: true,
        default:'Pending',
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Returned']
    },
    paymentStatus:{
        type:String,
        default:'Pending',
        enum:['Pending','Paid','Failed']
    },
    orderStatusTimestamps: {
        pending: { type: Date },
        processing: { type: Date },
        shipped: { type: Date },
        delivered: { type: Date },
        cancelled: { type: Date }
    },
    placedAt: {
        type: Date,
        default: Date.now
    },
    discountAmount: {
        type: Number
    },
    offerPercentage: {
        type: Number,
        default: 0
    },
    invoiceNumber: {
        type: String,
        unique: true
    },
    returnRequestDate: {
        type: Date, 
    }

    
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;