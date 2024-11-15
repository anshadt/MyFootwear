const mongoose = require('mongoose');

const referralOfferSchema = new mongoose.Schema({
    discountPercentage: {
        type: Number,
        required: true,
    },
    maxDiscountAmount: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true, // Allows partial deletion (disabling)
    }
});

module.exports = mongoose.model('ReferralOffer', referralOfferSchema);
