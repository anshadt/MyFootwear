const Razorpay = require('razorpay');
const dotenv = require('dotenv');

const razorpay = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEY_ID || "rzp_test_yn3COcw99NFgtQ",
  key_secret: process.env.RAZOR_PAY_KEY_SECRET || "Z2rdt298TEQOVZz6BYwZeWMj"
});








module.exports = razorpay;