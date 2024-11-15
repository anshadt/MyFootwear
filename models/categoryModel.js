const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
    category_name: {
        type: String,
        required: true
    },
    offer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Offer'
    },
    category_discription: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});



const category = mongoose.model("category", categorySchema)
module.exports = category