const mongoose=require('mongoose');

const addressSchema =mongoose.Schema({
    
    fullName: {
        type: String,
        required: true
    },
    streetAddress: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, { timestamps: true });

const address=mongoose.model("address",addressSchema);
module.exports=address