const Order=require('../../models/orderModel')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Coupon=require('../../models/couponModel')

const load_SalesReport = async (req, res) => {
  try {
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 6
    // const skip = (page-1)*limit;
    if (req.session.isAdmin) {
      // const totaProduct = skip(skip).limit(limit);
      // const totalPages = Math.ceil(totaProduct/limit);
      res.render("admin/salesReport",{title:'Admin Dashboard'});
    } else {
      res.redirect("/admin/loadAdminDash");
    }
  } catch (error) {
    console.error(error);
        res.status(500).json({ err: "An error occured" });
  }
   
  };
  

// const generateSalesReport = async (req, res) => {
//     try {
//         const { startDate, endDate, reportType } = req.body;
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999); 
//         if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//             return res.status(400).json({ error: 'Invalid start or end date' });
//         }
//         const orders = await Order.find({
//             placedAt: { $gte: start, $lte: end }
//         }).populate('user', 'username email')
//           .populate('items.product', 'product_name category')
//           .sort({ placedAt: -1 });
         
//         if (orders.length === 0) {
//             return res.status(404).json({ message: 'No orders found for the specified date range' });
//         }
//         const reportData = calculateReportData(orders);

//         reportData.orders = orders.map(order => ({
//             orderId: order.orderId,
//             orderDate: order.placedAt,
//             userName: order.user ? (order.user.username || order.user.email) : 'Unknown User', 
//             items: order.items.map(item => ({
//                 productName: item.product ? item.product.product_name : 'Unknown Product',
//                 quantity: item.quantity,
//                 unitPrice: item.price / item.quantity,
//                 offerPrice: item.discountAmount || item.price,
//                 lineTotal: (item.discountAmount || item.price)
//             })),
//             subtotal: order.items.reduce((sum, item) => sum + ((item.discountAmount || item.price)), 0),
//             couponCode: order.couponCode || null,
//             couponDiscount: order.discountAmount || 0,
//             totalAmount: order.totalAmount
//         }));
//         reportData.recentOrders = orders.slice(0, 5).map(order => ({
//             orderId: order.orderId,
//             date: order.placedAt.toISOString().split('T')[0],
//             status: order.orderStatus
//         }));
//         if (reportType === 'pdf') {
//             const pdfBuffer = await generatePDFReport(reportData);
//             res.contentType('application/pdf');
//             return res.send(pdfBuffer);
//         } else if (reportType === 'excel') {
//             const excelBuffer = await generateExcelReport(reportData);
//             res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//             return res.send(excelBuffer);
//         } else {
//             return res.json(reportData);
//         }
//     } catch (error) {
//         console.error('Error generating report:', error);
//         res.status(500).json({ error: 'An error occurred while generating the report', details: error.message });
//     }
// };

const generateSalesReport = async (req, res) => {
  try {
      const { startDate, endDate, reportType} = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); 

      // Validation of start and end dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ error: 'Invalid start or end date' });
      }
      
      // const page = parseInt(req.query.page)||1
      //   const limit = parseInt(req.query.limit)||10
      //   const skip = (page-1)*limit;

      
      const orders = await Order.find({
          placedAt: { $gte: start, $lte: end }
      }).populate('user', 'username email')
        .populate('items.product', 'productname category')
        .sort({ placedAt: -1})
      //   .skip(skip)
      //   .limit(limit)
      //   Order.countDocuments() 

  //     const orders = Order.find({
  //       placedAt: { $gte: start, $lte: end }
  //   }).populate('user', 'username email')
  //     .populate('items.product', 'product_name category')
  //     .sort({ placedAt: -1 });

  //   // Pagination logic
  //   const totalOrders = await Order.countDocuments({
  //     placedAt: { $gte: start, $lte: end }
  // });
  
  //   const totalPages = Math.ceil(totalOrders / limit);
  //   const skip = (page - 1) * limit;

  //   const paginatedOrders = await orders.skip(skip).limit(Number(limit));



      if (orders.length === 0) {
          return res.status(404).json({ message: 'No orders found for the specified date range' });
      }

      // Calculate report data and format it for frontend
      const reportData = calculateReportData(orders);

      // Add detailed order information for each order
      reportData.orders = orders.map(order => ({
          orderId: order.orderId,
          orderDate: order.placedAt,
          userName: order.user ? (order.user.username || order.user.email) : 'Unknown User',
          totalAmount: order.totalAmount,
          netSales: order.totalAmount - (order.discountAmount || 0), // Net Sales calculation
          items: order.items.map(item => ({
            productName: item.product ? item.product.productname : 'Unknown Product',
              quantity: item.quantity,
              unitPrice: item.price / item.quantity,
              offerPrice: item.discountAmount || item.price,
              lineTotal: (item.discountAmount || item.price) * item.quantity
          })),
          subtotal: order.items.reduce((sum, item) => sum + ((item.discountAmount || item.price) * item.quantity), 0),
          couponCode: order.couponCode || null,
          couponDiscount: order.discountAmount || 0
      }));

      // Add the most recent orders (if needed)
      reportData.recentOrders = orders.slice(0, 5).map(order => ({
          orderId: order.orderId,
          date: order.placedAt.toISOString().split('T')[0],
          status: order.orderStatus
      }));

      // Add statistics for total sales, total order amount, and total discount
      reportData.totalSalesCount = orders.length;
      reportData.totalOrderAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      reportData.totalDiscountApplied = orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);


      // const totalOrders = await Order.countDocuments({
      //   placedAt:{$gte: start, $lte:end}
      // })
      // reportData.totalPages = Math.ceil(totalOrders / limit); 
      //   reportData.currentPage = page;


    //   reportData.pagination = {
    //     totalOrders,
    //     totalPages,
    //     currentPage: Number(page),
    //     limit: Number(limit),
    // };

      // Determine the type of report (PDF, Excel, or JSON)
      if (reportType === 'pdf') {
          const pdfBuffer = await generatePDFReport(reportData);
          res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
          res.contentType('application/pdf');
          return res.send(pdfBuffer);
      } else if (reportType === 'excel') {
          const excelBuffer = await generateExcelReport(reportData);
          res.setHeader(
            'Content-Disposition',
            'attachment; filename="sales_report.xlsx"'
        );
          res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          return res.send(excelBuffer);
      } else {
          return res.json(reportData);
      }

  } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'An error occurred while generating the report', details: error.message });
  }
};





function generatePDFReport(data) {
  return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      let buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
      });

      // Header
      doc.rect(0, 0, doc.page.width, 40).fill('#1a237e');
      doc.fontSize(16).fillColor('#FFFFFF')
         .text('SALES REPORT', 50, 12, { align: 'center' });
      
      // Date Range
      doc.fontSize(10).fillColor('#000')
         .text(`Period: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`, 
               50, 50, { align: 'right' });

      // Summary Cards
      const summaryY = 70;
      const cardWidth = 158;
      const cardSpacing = 10;
      
      // Total Orders Card
      doc.rect(50, summaryY, cardWidth, 60).fill('#f8f9fa').stroke('#e0e0e0');
      doc.fontSize(12).fillColor('#666')
         .text('TOTAL SALES COUNT', 60, summaryY + 10);
      doc.fontSize(20).fillColor('#1a237e')
         .text(data.totalOrders.toString(), 60, summaryY + 30);

      // Total Revenue Card
      doc.rect(50 + cardWidth + cardSpacing, summaryY, cardWidth, 60).fill('#f8f9fa').stroke('#e0e0e0');
      doc.fontSize(12).fillColor('#666')
         .text('TOTAL ORDER AMOUNT', 60 + cardWidth + cardSpacing, summaryY + 10);
      doc.fontSize(20).fillColor('#1a237e')
         .text(`${data.finalTotal.toFixed(2)}`, 60 + cardWidth + cardSpacing, summaryY + 30);

      // Total Savings Card (Offers + Coupons)
      const totalDISCOUNT = data.offerDiscount + data.totalCouponDiscount;
      doc.rect(50 + (cardWidth + cardSpacing) * 2, summaryY, cardWidth, 60).fill('#f8f9fa').stroke('#e0e0e0');
      doc.fontSize(12).fillColor('#666')
         .text('TOTAL DISCOUNT', 60 + (cardWidth + cardSpacing) * 2, summaryY + 10);
      doc.fontSize(20).fillColor('#2e7d32')  // Green color for savings
         .text(`${totalDISCOUNT.toFixed(2)}`, 60 + (cardWidth + cardSpacing) * 2, summaryY + 30);

      doc.moveDown(4);

      // Orders Section with Items Detail
      data.orders.forEach((order, orderIndex) => {
          if (doc.y > 700) doc.addPage();

          // Order Header Box
          const orderY = doc.y;
          doc.rect(50, orderY, 495, 35).fill('#f8f9fa');
          
          // Order Header Info
          doc.fontSize(10).fillColor('#333');
          doc.text(`Order ID: ${order.orderId}`, 60, orderY + 10);
          doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 200, orderY + 10);
          doc.text(`Time: ${new Date(order.orderDate).toLocaleTimeString()}`, 340, orderY + 10);
          doc.text(`Customer: ${order.userName}`, 60, orderY + 20);

          doc.moveDown(2);

          // Items Table Header
          const tableTop = doc.y;
          doc.rect(50, tableTop, 495, 20).fill('#e3f2fd');
          
          // Column Headers
          doc.fontSize(9).fillColor('#1a237e');
          doc.text('PRODUCT', 60, tableTop + 6, { width: 200 });
          doc.text('QTY', 270, tableTop + 6, { width: 50, align: 'center' });
          doc.text('UNIT PRICE', 330, tableTop + 6, { width: 80, align: 'right' });
          doc.text('TOTAL', 420, tableTop + 6, { width: 80, align: 'right' });

          // Items Detail
          let currentY = tableTop + 20;
          order.items.forEach((item, index) => {
              doc.rect(50, currentY, 495, 25)
                 .fill(index % 2 === 0 ? '#ffffff' : '#f5f5f5');
              
              doc.fontSize(9).fillColor('#444');
              doc.text(item.productName, 60, currentY + 8, { width: 200 });
              doc.text(item.quantity.toString(), 270, currentY + 8, { width: 50, align: 'center' });
              doc.text(`${item.unitPrice.toFixed(2)}`, 330, currentY + 8, { width: 80, align: 'right' });
              doc.text(`${item.lineTotal.toFixed(2)}`, 420, currentY + 8, { width: 80, align: 'right' });

              currentY += 25;
          });

          // Order Summary Box
          doc.rect(50, currentY, 495, order.couponCode ? 75 : 50).fill('#f8f9fa');
          
          // Summary Details
          doc.fontSize(9).fillColor('#666');
          doc.text('Subtotal:', 350, currentY + 10, { width: 70, align: 'right' });
          doc.fillColor('#333')
             .text(`${order.subtotal.toFixed(2)}`, 420, currentY + 10, { width: 80, align: 'right' });

          if (order.couponCode) {
              doc.fillColor('#666')
                 .text(`Coupon Applied (${order.couponCode}):`, 350, currentY + 25, { width: 70, align: 'right' });
              doc.fillColor('#ff4444')
                 .text(`-${order.couponDiscount.toFixed(2)}`, 420, currentY + 25, { width: 80, align: 'right' });
              currentY += 15;
          }
          doc.fontSize(10).fillColor('#666')
             .text('Charges:', 350, currentY + 25, { width: 70, align: 'right' });
          doc.fillColor('#666')
             .text("50.00", 420, currentY + 25, { width: 80, align: 'right' });

          doc.moveDown(3);

          doc.fontSize(10).fillColor('#1a237e')
             .text('Total Amount:', 350, currentY + 40, { width: 70, align: 'right' });
          doc.fillColor('#1a237e')
             .text(`${order.totalAmount.toFixed(2)}`, 420, currentY + 40, { width: 80, align: 'right' });

          doc.moveDown(3);
      });

      // Footer
      doc.fontSize(8).fillColor('#666')
         .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 20, 
              { align: 'center', width: 495 });

      doc.end();
  });
}

// Helper function to draw a horizontal line
function generateHr(doc, y) {
  doc.strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
}




// async function generateExcelReport(data) {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Sales Report');

//     worksheet.columns = [
//         { header: 'Metric', key: 'metric', width: 30 },
//         { header: 'Value', key: 'value', width: 15 }
//     ];

//     worksheet.addRows([
//         { metric: 'Total Orders', value: data.totalOrders },
//         { metric: 'Original Total', value: data.originalTotal },
//         { metric: 'Offer Discount', value: data.offerDiscount },
//         { metric: 'Total After Offers', value: data.afterOfferTotal },
//         { metric: 'Coupon Discount', value: data.totalCouponDiscount },
//         { metric: 'Final Total', value: data.finalTotal }
//     ]);

//     return await workbook.xlsx.writeBuffer();
// }



async function generateExcelReport(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 15 }
  ];

  worksheet.addRows([
      { metric: 'Total Orders', value: data.totalOrders },
      { metric: 'Original Total', value: data.originalTotal },
      { metric: 'Offer Discount', value: data.offerDiscount },
      { metric: 'Total After Offers', value: data.afterOfferTotal },
      { metric: 'Coupon Discount', value: data.totalCouponDiscount },
      { metric: 'Final Total', value: data.finalTotal }
  ]);

  worksheet.addRow({ metric: '', value: '' }); // Spacer before the order details section
  worksheet.addRow({ metric: 'Order Details', value: '' }).font = { bold: true };

  worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Order Date', key: 'orderDate', width: 15 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'Product Name', key: 'productName', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Price', key: 'unitPrice', width: 15 },
      { header: 'Offer Price', key: 'offerPrice', width: 15 },
      { header: 'Line Total', key: 'lineTotal', width: 15 }
  ];

  // Add rows for each order and its items
  data.orders.forEach(order => {
      order.items.forEach(item => {
          worksheet.addRow({
              orderId: order.orderId,
              orderDate: new Date(order.orderDate).toLocaleDateString(),
              userName: order.userName,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              offerPrice: item.offerPrice,
              lineTotal: item.lineTotal
          });
      });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}



// function calculateReportData(orders) {
//     let originalTotal = 0;
//     let afterOfferTotal = 0;
//     let totalCouponDiscount = 0;
//     let finalTotal = 0;

//     orders.forEach(order => {
//         const originalOrderTotal = order.items.reduce((sum, item) => sum + (item.price), 0);
//         const afterOfferOrderTotal = order.items.reduce((sum, item) => 
//             sum + ((item.discountAmount || item.price) * item.quantity), 0);
//         const couponDiscount = order.discountAmount || 0;
        
//         originalTotal += originalOrderTotal;
//         afterOfferTotal += afterOfferOrderTotal;
//         totalCouponDiscount += couponDiscount;  
//         finalTotal += order.totalAmount;
//     });

//     return {
//         totalOrders: orders.length,
//         originalTotal,
//         offerDiscount: originalTotal - afterOfferTotal,
//         afterOfferTotal,
//         totalCouponDiscount,
//         finalTotal: afterOfferTotal - totalCouponDiscount 
//     };
// }

function calculateReportData(orders) {
  let originalTotal = 0;
  let afterOfferTotal = 0;
  let totalCouponDiscount = 0;
  let finalTotal = 0;

  orders.forEach(order => {
      const originalOrderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const afterOfferOrderTotal = order.items.reduce((sum, item) => 
          sum + ((item.discountAmount || item.price) * item.quantity), 0);
      const couponDiscount = order.discountAmount || 0;

      originalTotal += originalOrderTotal;
      afterOfferTotal += afterOfferOrderTotal;
      totalCouponDiscount += couponDiscount;  
      finalTotal += order.totalAmount;
  });

  return {
      totalOrders: orders.length,
      originalTotal,
      offerDiscount: originalTotal - afterOfferTotal,
      afterOfferTotal,
      totalCouponDiscount,
      finalTotal: afterOfferTotal - totalCouponDiscount,

  };
}




const sales_Chart = async (req, res) => {
    try {
      const { chartType } = req.query; 

      let aggregationPipeline = [];

      if (chartType === 'yearly') {
        aggregationPipeline = [
          {
            $group: {
              _id: { $year: "$createdAt" },  
              orderCount: { $sum: 1 }
            }
          },
          {
            $project: {
              year: "$_id",
              orderCount: 1,
              _id: 0
            }
          },
          { $sort: { year: -1 } },  
          { $limit: 5 },  
          { $sort: { year: 1 } } 
        ];
      } else {
        
        aggregationPipeline = [
          {
            $group: {
              _id: { $month: "$createdAt" }, 
              orderCount: { $sum: 1 }
            }
          },
          {
            $project: {
              month: {
                $let: {
                  vars: {
                    monthsInString: [, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                  },
                  in: {
                    $arrayElemAt: ['$$monthsInString', '$_id']
                  }
                }
              },
              orderCount: 1,
              _id: 0
            }
          },
          { $sort: { _id: -1 } }, 
          { $limit: 5 },  
          { $sort: { _id: 1 } } 
        ];
      }

      
      const orderData = await Order.aggregate(aggregationPipeline);

      res.json(orderData);
    } catch (error) {
      console.error('Error fetching order data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};





module.exports ={
    generateSalesReport,
    sales_Chart,
    load_SalesReport

}