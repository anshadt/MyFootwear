const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    items:[{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: {
            type: Number
        }
    }],
    total_price:{
        type:Number
    },
    discountAmount:{
        type: Number,
        default:0
    },
    appliedCoupon:{
        type:String
    }
},{ timestamps :true});

const Cart = mongoose.model('Cart',cartSchema)

module.exports = Cart