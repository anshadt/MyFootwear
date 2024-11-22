const Order=require('../../models/orderModel')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Coupon=require('../../models/couponModel')



const generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid start or end date' });
        }
        const orders = await Order.find({
            placedAt: { $gte: start, $lte: end }
        }).populate('user', 'username email')
          .populate('items.product', 'product_name category')
          .sort({ placedAt: -1 });
         
        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for the specified date range' });
        }
        const reportData = calculateReportData(orders);

        reportData.orders = orders.map(order => ({
            orderId: order.orderId,
            orderDate: order.placedAt,
            userName: order.user ? (order.user.username || order.user.email) : 'Unknown User', 
            items: order.items.map(item => ({
                productName: item.product ? item.product.product_name : 'Unknown Product',
                quantity: item.quantity,
                unitPrice: item.price / item.quantity,
                offerPrice: item.discountAmount || item.price,
                lineTotal: (item.discountAmount || item.price)
            })),
            subtotal: order.items.reduce((sum, item) => sum + ((item.discountAmount || item.price)), 0),
            couponCode: order.couponCode || null,
            couponDiscount: order.discountAmount || 0,
            totalAmount: order.totalAmount
        }));
        reportData.recentOrders = orders.slice(0, 5).map(order => ({
            orderId: order.orderId,
            date: order.placedAt.toISOString().split('T')[0],
            status: order.orderStatus
        }));
        if (reportType === 'pdf') {
            const pdfBuffer = await generatePDFReport(reportData);
            res.contentType('application/pdf');
            return res.send(pdfBuffer);
        } else if (reportType === 'excel') {
            const excelBuffer = await generateExcelReport(reportData);
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

        
        doc.fontSize(22).fillColor('#333').text('Sales Report', { align: 'center', underline: true });
        doc.moveDown(2);

       
        generateHr(doc, doc.y + 10);

      
        doc.fontSize(14).fillColor('#000').text('Summary:', { underline: true });
        doc.moveDown(1);
        
        const summaryData = [
            { label: 'Total Orders:', value: data.totalOrders },
            { label: 'Original Total:', value: `Rs. ${data.originalTotal.toFixed(2)}` },
            { label: 'Offer Discount:', value: `Rs. ${data.offerDiscount.toFixed(2)}` },
            { label: 'Total After Offers:', value: `Rs. ${data.afterOfferTotal.toFixed(2)}` },
            { label: 'Coupon Discount:', value: `Rs. ${data.totalCouponDiscount.toFixed(2)}` },
            { label: 'Final Total:', value: `Rs. ${data.finalTotal.toFixed(2)}` }
        ];
        
        
     
        


        summaryData.forEach((item, index) => {
            doc.fontSize(12)
               .text(item.label, 50, doc.y)
               .text(item.value, 200, doc.y - 12, { align: 'left' });
            if (index < summaryData.length - 1) doc.moveDown(0.5);
        });

        generateHr(doc, doc.y + 20);

        
        doc.fontSize(14).fillColor('#000').text('Detailed Order List:', { underline: true });
        doc.moveDown(1);

        for (const order of data.orders) {
            // Add Order header
            doc.fontSize(12).fillColor('#333')
               .text(`Order ID: ${order.orderId}`, 50, doc.y)
               .text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, 400, doc.y - 12, { align: 'right' });
            doc.moveDown(0.5);
            doc.text(`User: ${order.userName}`, 50, doc.y); 
            doc.moveDown(0.5);

            // Table header
            const tableTop = doc.y;
            doc.fontSize(10).fillColor('#555');
            [
                { text: 'Item', x: 50, width: 200 },
                { text: 'Qty', x: 250, width: 30, align: 'center' },
                { text: 'Unit Price', x: 280, width: 80, align: 'right' },
                { text: 'Offer Price', x: 360, width: 80, align: 'right' },
                { text: 'Line Total', x: 440, width: 80, align: 'right' }
            ].forEach(header => {
                doc.text(header.text, header.x, tableTop, { width: header.width, align: header.align || 'left' });
            });

            generateHr(doc, doc.y + 10);
            doc.moveDown(0.5);

            // Add each item in the order
            let orderSubtotal = 0;
            for (const item of order.items) {
                const itemTop = doc.y;
                doc.fontSize(10).fillColor('#000');
                doc.text(item.productName || 'Unknown Product', 50, itemTop, { width: 200 });
                doc.text(item.quantity.toString(), 250, itemTop, { width: 30, align: 'center' });
                doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 280, itemTop, { width: 80, align: 'right' });
                doc.text(`Rs. ${item.offerPrice.toFixed(2)}`, 360, itemTop, { width: 80, align: 'right' });
                doc.text(`Rs. ${item.lineTotal.toFixed(2)}`, 440, itemTop, { width: 80, align: 'right' });
                doc.moveDown(0.5);
                orderSubtotal += item.lineTotal;
            }

            // Order total and coupon
            generateHr(doc, doc.y + 5);
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#333');
            doc.text(`Subtotal: Rs. ${orderSubtotal.toFixed(2)}`, 350, doc.y, { width: 150, align: 'right' });
            if (order.couponCode) {
                doc.moveDown(0.5);
                doc.text(`Coupon (${order.couponCode}): -Rs. ${order.couponDiscount.toFixed(2)}`, 350, doc.y, { width: 150, align: 'right' });
            }
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor('#000');
            doc.text(`Total: Rs. ${order.totalAmount.toFixed(2)}`, 350, doc.y, { width: 150, align: 'right' });

            doc.moveDown(2);
        }

        
        const footerPosition = doc.page.height - 50;
        doc.fontSize(10).fillColor('#888')
           .text('Generated on: ' + new Date().toLocaleDateString(), 50, footerPosition, { align: 'center', width: 500 });
        
        doc.fontSize(10).text('Thank you for your business!', { align: 'center', width: 500 });

        
        doc.end();
    });
}

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}



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

    return await workbook.xlsx.writeBuffer();
}

function calculateReportData(orders) {
    let originalTotal = 0;
    let afterOfferTotal = 0;
    let totalCouponDiscount = 0;
    let finalTotal = 0;

    orders.forEach(order => {
        const originalOrderTotal = order.items.reduce((sum, item) => sum + (item.price), 0);
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
        finalTotal: afterOfferTotal - totalCouponDiscount 
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
        // Default to monthly aggregation
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

      // Perform aggregation query with the dynamic pipeline
      const orderData = await Order.aggregate(aggregationPipeline);

      res.json(orderData);
    } catch (error) {
      console.error('Error fetching order data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};





module.exports ={
    generateSalesReport,
    sales_Chart

}