const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true
    },
    sequence: {
        type: Number,
        default: 0
    }
});

const InvoiceCounter = mongoose.model('InvoiceCounter', invoiceCounterSchema);
module.exports = InvoiceCounter; 