async function placeOrder() {
    console.log("placeOrder function triggered!");

const couponCode = document.getElementById('couponCode').value.trim();
const addressId = document.getElementById('exampleFormControlSelect1').value.trim();
const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').id.trim();

console.log("Coupon Code:", couponCode);
console.log("Address ID:", addressId);
console.log("Payment Method:", paymentMethod);

if (!addressId || !paymentMethod) {
    Swal.fire({
        title: 'Error',
        text: 'Please select an address and payment method.',
        icon: 'error'
    });
    return;
}

if (paymentMethod === 'cod') { 
            try {
                const response = await fetch('/placeOrder', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ addressId, paymentMethod, couponCode })
                });

        if (response.ok) {
          const result=await response.json()
          if(result.success){
            Swal.fire({
                title: 'Order Placed!',
                text: 'Your order was placed successfully.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = '/orderHistory';
            });
          }else{
            Swal.fire({
                title: 'failed  Place Order!',
                text: result.message,
                icon: 'error',
                timer: 2000,
                showConfirmButton: false
            })
          }
            
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Failed!',
                text: 'Failed to place the order. Please try again.',
            });
        }
    } catch (error) {
        console.error('Error while placing order', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred while placing the order.',
        });
    }
} else if (paymentMethod === 'card') {
console.log('card1')

    try {
      console.log(addressId, paymentMethod, couponCode);
        const response = await fetch('/razor-Pay-OrderCreate', {
         
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ addressId, paymentMethod, couponCode })
            
            
        });
        console.log('fetch')
        if (response.ok) {
          console.log('response')
            const result = await response.json();


            if (result.success) {
              console.log('sucess')
              console.log('payble amount',result.payableAmount);
              console.log('order id',result.razorpayOrder.id);
              
              
                const options = {
                    key: 'rzp_test_yn3COcw99NFgtQ', 
                    amount: result.payableAmount,
                    currency: 'INR',
                    name: 'Footwer',
                    description: 'Payment for order',
                    order_id: result.razorpayOrder.id,
                    handler: async function (response) {
                        try {
                            const response2 = await fetch('/razor-Pay-Payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    addressId, paymentMethod, couponCode,
                                    payment_id: response.razorpay_payment_id,
                                    order_id: response.razorpay_order_id,
                                    signature: response.razorpay_signature
                                })
                            });

                            const verifyData = await response2.json();
                            console.log('verifyData')
                            if (response2.ok && verifyData.success) {
                              console.log('response2.ok')
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Order Placed',
                                    text: 'Your order has been placed successfully.',
                                    timer: 2000,
                                    showConfirmButton: false
                                }).then(() => {
                                    window.location.href = '/orderHistory';
                                });
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Payment Verification Failed',
                                    text: verifyData.error || 'Payment verification failed. Please try again.'
                                });
                            }
                        } catch (error) {
                            console.error('Error verifying payment:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Payment Error',
                                text: 'An unexpected error occurred during payment verification.'
                            });
                        }
                    },
                    prefill: {
                        name: 'User Name',
                        email: 'useremail@email.com',
                        contact: '112233665544'
                    },
                    theme: {
                        color: '#000000'
                    }
                };

                const razorpay = new Razorpay(options);

                razorpay.on('payment.failed', async function (response) {
                    console.error('Payment Failed:', response);

                    if (response.error && response.error.metadata) {
                        try {
                            const response3 = await fetch('/razor-Pay-Payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    addressId,
                                    paymentMethod,
                                    couponCode,
                                    payment_id: response.error.metadata.payment_id,
                                    order_id: response.error.metadata.order_id
                                })
                            });

                            const failedData = await response3.json();
                            const orderId = failedData.orderId;
                            
                            Swal.fire({
                                icon: 'warning',
                                title: 'Payment Failed',
                                text: 'Payment was unsuccessful. Redirecting to order details...',
                                timer: 1000,
                                showConfirmButton: false
                            }).then(() => {
                                if (failedData.response) {
                                    window.location.href = failedData.response;
                                } else {
                                    window.location.href = "/orderHistory";
                                }
                            });
                        } catch (fetchError) {
                            console.error('Error logging failed payment:', fetchError);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'An error occurred while processing payment failure.'
                            });
                        }
                    } else {
                        console.warn('Missing metadata in payment failed response');
                        Swal.fire({
                            icon: 'error',
                            title: 'Payment Error',
                            text: 'Payment failed with no additional data. Please try again.'
                        });
                    }
                });

                razorpay.open();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Payment Initialization Failed',
                    text: 'Could not initialize payment. Please try again.'
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Order Failed',
                text: 'Unable to place the order. Please try again later.'
            });
        }
    } catch (error) {
        console.error('Error processing order:', error);
        Swal.fire({
            icon: 'error',
            title: 'Order Error',
            text: 'An unexpected error occurred while processing the order.'
        });
    }
}

if (paymentMethod === 'Wallet') {
  
  console.log('Request Payload:', { addressId, paymentMethod, couponCode });
      const response = await fetch('/orderWallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addressId, paymentMethod, couponCode })
      });


      if (response.ok) {
        console.log("Server response:", response);

        const result = await response.json()

        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Order Placed',
            text: 'The order is successfully placed.',
            confirmButtonText: 'OK'
          }).then(() => {
            window.location.href = '/orderHistory';
          });

        } else {
          if (result.message === 'not enough money in your wallet') {
            Swal.fire({
              icon: 'info',
              title: 'insufficient money',
              text: result.message,
              confirmButtonText: 'OK'
            })
            return
          }


          Swal.fire({
            icon: 'error',
            title: 'Order Not Placed',
            text: result.message,
            confirmButtonText: 'OK'
          })
        }

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Order',
          text: 'Unable to place order. Please try again later.',
          confirmButtonText: 'OK'
        });
      }
    }
  }