const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const csv = require('csv-writer');
const fs = require('fs');
const path = require('path');

class ExportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../exports');
    this.ensureExportDir();
  }

  // Ensure export directory exists
  ensureExportDir() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  // Generate PDF Report
  async generatePDFReport(reportData, reportType = 'general') {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `${reportType}_report_${Date.now()}.pdf`;
      const filePath = path.join(this.exportDir, filename);

      // Stream to file
      doc.pipe(fs.createWriteStream(filePath));

      // Header
      doc.fontSize(20).text('eFood Report', { align: 'center' });
      doc.moveDown();

      // Report title
      doc.fontSize(16).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
      doc.moveDown();

      // Date range
      if (reportData.dateRange) {
        doc.fontSize(12).text(`Date Range: ${reportData.dateRange.from} to ${reportData.dateRange.to}`, { align: 'center' });
        doc.moveDown();
      }

      // Add content based on report type
      switch (reportType) {
        case 'order':
          this.addOrderReportContent(doc, reportData);
          break;
        case 'earning':
          this.addEarningReportContent(doc, reportData);
          break;
        case 'delivery':
          this.addDeliveryReportContent(doc, reportData);
          break;
        case 'product':
          this.addProductReportContent(doc, reportData);
          break;
        case 'sale':
          this.addSaleReportContent(doc, reportData);
          break;
        default:
          this.addGeneralReportContent(doc, reportData);
      }

      // Footer
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();

      return { filePath, filename };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  // Generate CSV Report
  async generateCSVReport(reportData, reportType = 'general') {
    try {
      const filename = `${reportType}_report_${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, filename);

      let headers = [];
      let records = [];

      // Configure headers and records based on report type
      switch (reportType) {
        case 'order':
          headers = this.getOrderCSVHeaders();
          records = this.formatOrderDataForCSV(reportData.orders || []);
          break;
        case 'earning':
          headers = this.getEarningCSVHeaders();
          records = this.formatEarningDataForCSV(reportData.earning_data || []);
          break;
        case 'delivery':
          headers = this.getDeliveryCSVHeaders();
          records = this.formatDeliveryDataForCSV(reportData.delivery_men || []);
          break;
        case 'product':
          headers = this.getProductCSVHeaders();
          records = this.formatProductDataForCSV(reportData.products || []);
          break;
        case 'sale':
          headers = this.getSaleCSVHeaders();
          records = this.formatSaleDataForCSV(reportData.sales || []);
          break;
      }

      const csvWriter = csv.createObjectCsvWriter({
        path: filePath,
        header: headers
      });

      await csvWriter.writeRecords(records);

      return { filePath, filename };
    } catch (error) {
      console.error('CSV generation error:', error);
      throw error;
    }
  }

  // Generate Excel Report
  async generateExcelReport(reportData, reportType = 'general') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      const filename = `${reportType}_report_${Date.now()}.xlsx`;
      const filePath = path.join(this.exportDir, filename);

      // Configure worksheet based on report type
      switch (reportType) {
        case 'order':
          this.configureOrderExcel(worksheet, reportData);
          break;
        case 'earning':
          this.configureEarningExcel(worksheet, reportData);
          break;
        case 'delivery':
          this.configureDeliveryExcel(worksheet, reportData);
          break;
        case 'product':
          this.configureProductExcel(worksheet, reportData);
          break;
        case 'sale':
          this.configureSaleExcel(worksheet, reportData);
          break;
      }

      await workbook.xlsx.writeFile(filePath);

      return { filePath, filename };
    } catch (error) {
      console.error('Excel generation error:', error);
      throw error;
    }
  }

  // PDF Content Methods
  addOrderReportContent(doc, reportData) {
    // Summary
    if (reportData.summary) {
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(12)
        .text(`Total Orders: ${reportData.summary.total_orders}`)
        .text(`Total Revenue: $${reportData.summary.total_revenue.toFixed(2)}`)
        .text(`Average Order Value: $${reportData.summary.avg_order_value.toFixed(2)}`);
      doc.moveDown();
    }

    // Orders table
    if (reportData.orders && reportData.orders.length > 0) {
      doc.fontSize(14).text('Orders', { underline: true });
      doc.fontSize(10);

      const orders = reportData.orders.slice(0, 20); // Limit for PDF
      orders.forEach((order, index) => {
        const customerName = order.customer ? `${order.customer.f_name} ${order.customer.l_name}` : 'N/A';
        doc.text(`${index + 1}. Order #${order.id} - ${customerName} - $${order.order_amount} - ${order.order_status}`);
      });
    }
  }

  addEarningReportContent(doc, reportData) {
    // Summary
    if (reportData.summary) {
      doc.fontSize(14).text('Earning Summary', { underline: true });
      doc.fontSize(12)
        .text(`Total Revenue: $${reportData.summary.total_revenue.toFixed(2)}`)
        .text(`Total Tax: $${reportData.summary.total_tax.toFixed(2)}`)
        .text(`Net Revenue: $${reportData.summary.net_revenue.toFixed(2)}`);
      doc.moveDown();
    }

    // Earning data
    if (reportData.earning_data && reportData.earning_data.length > 0) {
      doc.fontSize(14).text('Earning Breakdown', { underline: true });
      doc.fontSize(10);

      reportData.earning_data.forEach(item => {
        doc.text(`${item.period}: ${item.order_count} orders - $${item.total_amount.toFixed(2)}`);
      });
    }
  }

  addDeliveryReportContent(doc, reportData) {
    if (reportData.delivery_men && reportData.delivery_men.length > 0) {
      doc.fontSize(14).text('Delivery Man Performance', { underline: true });
      doc.fontSize(10);

      reportData.delivery_men.forEach((dm, index) => {
        const name = dm.delivery_man ? `${dm.delivery_man.f_name} ${dm.delivery_man.l_name}` : 'N/A';
        doc.text(`${index + 1}. ${name} - ${dm.total_deliveries} deliveries - ${dm.success_rate}% success rate`);
      });
    }
  }

  addProductReportContent(doc, reportData) {
    if (reportData.products && reportData.products.length > 0) {
      doc.fontSize(14).text('Product Performance', { underline: true });
      doc.fontSize(10);

      reportData.products.forEach((product, index) => {
        const name = product.product ? product.product.name : 'N/A';
        doc.text(`${index + 1}. ${name} - ${product.total_quantity} sold - $${product.total_sales.toFixed(2)}`);
      });
    }
  }

  addSaleReportContent(doc, reportData) {
    // Summary
    if (reportData.summary) {
      doc.fontSize(14).text('Sales Summary', { underline: true });
      doc.fontSize(12)
        .text(`Total Sales: $${reportData.summary.total_sales.toFixed(2)}`)
        .text(`Total Quantity: ${reportData.summary.total_quantity}`)
        .text(`Average Sale Value: $${reportData.summary.avg_sale_value.toFixed(2)}`);
      doc.moveDown();
    }

    // Sales data
    if (reportData.sales && reportData.sales.length > 0) {
      doc.fontSize(14).text('Sales Details', { underline: true });
      doc.fontSize(10);

      const sales = reportData.sales.slice(0, 20); // Limit for PDF
      sales.forEach((sale, index) => {
        const productName = sale.product ? sale.product.name : 'N/A';
        doc.text(`${index + 1}. ${productName} - Qty: ${sale.quantity} - $${sale.total.toFixed(2)}`);
      });
    }
  }

  addGeneralReportContent(doc, reportData) {
    doc.fontSize(12).text('General Report Data:');
    doc.fontSize(10).text(JSON.stringify(reportData, null, 2));
  }

  // CSV Header Methods
  getOrderCSVHeaders() {
    return [
      { id: 'order_id', title: 'Order ID' },
      { id: 'customer_name', title: 'Customer Name' },
      { id: 'customer_phone', title: 'Customer Phone' },
      { id: 'order_amount', title: 'Order Amount' },
      { id: 'order_status', title: 'Order Status' },
      { id: 'payment_method', title: 'Payment Method' },
      { id: 'created_at', title: 'Order Date' }
    ];
  }

  getEarningCSVHeaders() {
    return [
      { id: 'period', title: 'Period' },
      { id: 'order_count', title: 'Order Count' },
      { id: 'total_amount', title: 'Total Amount' }
    ];
  }

  getDeliveryCSVHeaders() {
    return [
      { id: 'delivery_man_name', title: 'Delivery Man Name' },
      { id: 'delivery_man_phone', title: 'Phone' },
      { id: 'total_deliveries', title: 'Total Deliveries' },
      { id: 'successful_deliveries', title: 'Successful Deliveries' },
      { id: 'success_rate', title: 'Success Rate %' },
      { id: 'total_amount', title: 'Total Amount' }
    ];
  }

  getProductCSVHeaders() {
    return [
      { id: 'product_name', title: 'Product Name' },
      { id: 'category_name', title: 'Category' },
      { id: 'total_quantity', title: 'Total Quantity' },
      { id: 'total_sales', title: 'Total Sales' },
      { id: 'total_orders', title: 'Total Orders' },
      { id: 'avg_rating', title: 'Average Rating' }
    ];
  }

  getSaleCSVHeaders() {
    return [
      { id: 'order_id', title: 'Order ID' },
      { id: 'date', title: 'Date' },
      { id: 'customer_name', title: 'Customer Name' },
      { id: 'product_name', title: 'Product Name' },
      { id: 'quantity', title: 'Quantity' },
      { id: 'price', title: 'Price' },
      { id: 'total', title: 'Total' }
    ];
  }

  // CSV Data Formatting Methods
  formatOrderDataForCSV(orders) {
    return orders.map(order => ({
      order_id: order.id,
      customer_name: order.customer ? `${order.customer.f_name} ${order.customer.l_name}` : 'N/A',
      customer_phone: order.customer ? order.customer.phone : 'N/A',
      order_amount: order.order_amount,
      order_status: order.order_status,
      payment_method: order.payment_method,
      created_at: order.created_at
    }));
  }

  formatEarningDataForCSV(earningData) {
    return earningData.map(item => ({
      period: item.period,
      order_count: item.order_count,
      total_amount: item.total_amount
    }));
  }

  formatDeliveryDataForCSV(deliveryMen) {
    return deliveryMen.map(dm => ({
      delivery_man_name: dm.delivery_man ? `${dm.delivery_man.f_name} ${dm.delivery_man.l_name}` : 'N/A',
      delivery_man_phone: dm.delivery_man ? dm.delivery_man.phone : 'N/A',
      total_deliveries: dm.total_deliveries,
      successful_deliveries: dm.successful_deliveries,
      success_rate: dm.success_rate,
      total_amount: dm.total_amount
    }));
  }

  formatProductDataForCSV(products) {
    return products.map(product => ({
      product_name: product.product ? product.product.name : 'N/A',
      category_name: product.category ? product.category.name : 'N/A',
      total_quantity: product.total_quantity,
      total_sales: product.total_sales,
      total_orders: product.total_orders,
      avg_rating: product.reviews ? product.reviews.avg_rating : 0
    }));
  }

  formatSaleDataForCSV(sales) {
    return sales.map(sale => ({
      order_id: sale.order_id,
      date: sale.date,
      customer_name: sale.customer ? `${sale.customer.f_name} ${sale.customer.l_name}` : 'N/A',
      product_name: sale.product ? sale.product.name : 'N/A',
      quantity: sale.quantity,
      price: sale.price,
      total: sale.total
    }));
  }

  // Excel Configuration Methods
  configureOrderExcel(worksheet, reportData) {
    worksheet.columns = [
      { header: 'Order ID', key: 'order_id', width: 15 },
      { header: 'Customer Name', key: 'customer_name', width: 25 },
      { header: 'Customer Phone', key: 'customer_phone', width: 15 },
      { header: 'Order Amount', key: 'order_amount', width: 15 },
      { header: 'Order Status', key: 'order_status', width: 15 },
      { header: 'Payment Method', key: 'payment_method', width: 15 },
      { header: 'Order Date', key: 'created_at', width: 20 }
    ];

    if (reportData.orders) {
      reportData.orders.forEach(order => {
        worksheet.addRow({
          order_id: order.id,
          customer_name: order.customer ? `${order.customer.f_name} ${order.customer.l_name}` : 'N/A',
          customer_phone: order.customer ? order.customer.phone : 'N/A',
          order_amount: order.order_amount,
          order_status: order.order_status,
          payment_method: order.payment_method,
          created_at: order.created_at
        });
      });
    }
  }

  configureEarningExcel(worksheet, reportData) {
    worksheet.columns = [
      { header: 'Period', key: 'period', width: 20 },
      { header: 'Order Count', key: 'order_count', width: 15 },
      { header: 'Total Amount', key: 'total_amount', width: 15 }
    ];

    if (reportData.earning_data) {
      reportData.earning_data.forEach(item => {
        worksheet.addRow({
          period: item.period,
          order_count: item.order_count,
          total_amount: item.total_amount
        });
      });
    }
  }

  configureDeliveryExcel(worksheet, reportData) {
    worksheet.columns = [
      { header: 'Delivery Man Name', key: 'delivery_man_name', width: 25 },
      { header: 'Phone', key: 'delivery_man_phone', width: 15 },
      { header: 'Total Deliveries', key: 'total_deliveries', width: 15 },
      { header: 'Successful Deliveries', key: 'successful_deliveries', width: 20 },
      { header: 'Success Rate %', key: 'success_rate', width: 15 },
      { header: 'Total Amount', key: 'total_amount', width: 15 }
    ];

    if (reportData.delivery_men) {
      reportData.delivery_men.forEach(dm => {
        worksheet.addRow({
          delivery_man_name: dm.delivery_man ? `${dm.delivery_man.f_name} ${dm.delivery_man.l_name}` : 'N/A',
          delivery_man_phone: dm.delivery_man ? dm.delivery_man.phone : 'N/A',
          total_deliveries: dm.total_deliveries,
          successful_deliveries: dm.successful_deliveries,
          success_rate: dm.success_rate,
          total_amount: dm.total_amount
        });
      });
    }
  }

  configureProductExcel(worksheet, reportData) {
    worksheet.columns = [
      { header: 'Product Name', key: 'product_name', width: 30 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Total Quantity', key: 'total_quantity', width: 15 },
      { header: 'Total Sales', key: 'total_sales', width: 15 },
      { header: 'Total Orders', key: 'total_orders', width: 15 },
      { header: 'Average Rating', key: 'avg_rating', width: 15 }
    ];

    if (reportData.products) {
      reportData.products.forEach(product => {
        worksheet.addRow({
          product_name: product.product ? product.product.name : 'N/A',
          category_name: product.category ? product.category.name : 'N/A',
          total_quantity: product.total_quantity,
          total_sales: product.total_sales,
          total_orders: product.total_orders,
          avg_rating: product.reviews ? product.reviews.avg_rating : 0
        });
      });
    }
  }

  configureSaleExcel(worksheet, reportData) {
    worksheet.columns = [
      { header: 'Order ID', key: 'order_id', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer Name', key: 'customer_name', width: 25 },
      { header: 'Product Name', key: 'product_name', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Total', key: 'total', width: 12 }
    ];

    if (reportData.sales) {
      reportData.sales.forEach(sale => {
        worksheet.addRow({
          order_id: sale.order_id,
          date: sale.date,
          customer_name: sale.customer ? `${sale.customer.f_name} ${sale.customer.l_name}` : 'N/A',
          product_name: sale.product ? sale.product.name : 'N/A',
          quantity: sale.quantity,
          price: sale.price,
          total: sale.total
        });
      });
    }
  }

  // Clean up old export files
  async cleanupOldExports(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const files = fs.readdirSync(this.exportDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stat = fs.statSync(filePath);
        
        if (now - stat.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new ExportService(); 