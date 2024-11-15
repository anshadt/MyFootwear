const mongoose = require('mongoose')

const walletSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
      },
      balanceAmount: {
        type: Number,
        default: 0,
        required: true
      },
      wallet_history: [
        {
          date: {
            type: Date,
            //required: true,
            default: Date.now
          },
          amount: {
            type: Number,
            required: true
          },
          referralId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Stores the referrer or referred user ID
           // default: null
        },
        
          description: {
            type: String,
            //required: true
          },
          
          transactionType: {
            type: String,
            //required: true,
            enum: ['credited', 'debited']
          }
        }
      ]
    }, {timestamps: true});

const Wallet = mongoose.model('Wallet',walletSchema)
module.exports = Wallet;