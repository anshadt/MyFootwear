const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30' 
    },
    verified: {
        type: Boolean,
        default: false 
    }
});
const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
