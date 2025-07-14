const nodemailer = require('nodemailer');
const { EmailNotification } = require('../models');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  async initializeTransporter() {
    try {
      // Check if email credentials are provided
      if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
        console.log('Email credentials not configured. Email service will be disabled.');
        this.initialized = false;
        return;
      }

      const emailConfig = {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_ENCRYPTION === 'ssl',
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD
        }
      };

      this.transporter = nodemailer.createTransport(emailConfig);
      
      // Verify connection
      await this.transporter.verify();
      this.initialized = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Email service initialization error:', error);
      this.initialized = false;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, body, options = {}) {
    if (!this.initialized) {
      console.warn('Email service not initialized. Email will not be sent.');
      return {
        success: false,
        error: 'Email service not available'
      };
    }

    try {
      const fromEmail = options.from || process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME;
      const fromName = options.fromName || process.env.MAIL_FROM_NAME || 'eFood';

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        text: body,
        html: options.html || this.generateHtmlEmail(body, options),
        attachments: options.attachments || []
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // Log email notification
      await this.logEmailNotification({
        to_email: to,
        to_name: options.toName,
        from_email: fromEmail,
        from_name: fromName,
        subject,
        body,
        html_body: options.html,
        user_id: options.user_id,
        type: options.type || 'general',
        template: options.template,
        template_data: options.templateData ? JSON.stringify(options.templateData) : null,
        status: 'sent',
        message_id: result.messageId,
        attachments: options.attachments ? JSON.stringify(options.attachments) : null,
        priority: options.priority || 'normal',
        sent_at: new Date()
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('Email send error:', error);
      
      // Log failed email
      await this.logEmailNotification({
        to_email: to,
        to_name: options.toName,
        from_email: options.from || process.env.MAIL_FROM_ADDRESS,
        from_name: options.fromName || process.env.MAIL_FROM_NAME,
        subject,
        body,
        html_body: options.html,
        user_id: options.user_id,
        type: options.type || 'general',
        template: options.template,
        template_data: options.templateData ? JSON.stringify(options.templateData) : null,
        status: 'failed',
        error_message: error.message,
        priority: options.priority || 'normal'
      });

      throw error;
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(to, template, data = {}, options = {}) {
    try {
      const emailTemplate = this.getEmailTemplate(template);
      if (!emailTemplate) {
        throw new Error(`Email template '${template}' not found`);
      }

      const subject = this.processTemplate(emailTemplate.subject, data);
      const body = this.processTemplate(emailTemplate.body, data);
      const html = this.processTemplate(emailTemplate.html, data);

      return await this.sendEmail(to, subject, body, {
        ...options,
        html,
        template,
        templateData: data,
        type: emailTemplate.type || 'general'
      });
    } catch (error) {
      console.error('Template email send error:', error);
      throw error;
    }
  }

  /**
   * Process email template with data
   */
  processTemplate(template, data) {
    if (!template) return '';
    
    let processedTemplate = template;
    
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      processedTemplate = processedTemplate.replace(placeholder, data[key] || '');
    });

    return processedTemplate;
  }

  /**
   * Generate basic HTML email
   */
  generateHtmlEmail(body, options = {}) {
    const logoUrl = options.logoUrl || `${process.env.APP_URL}/assets/images/logo.png`;
    const appName = options.appName || 'eFood';
    const appUrl = options.appUrl || process.env.APP_URL;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${options.title || 'Notification'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #ddd; }
          .logo { max-width: 150px; height: auto; }
          .content { padding: 20px 0; line-height: 1.6; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="${appName}" class="logo">
          </div>
          <div class="content">
            ${body.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p><a href="${appUrl}">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get email template
   */
  getEmailTemplate(templateName) {
    const templates = {
      welcome: {
        subject: 'Welcome to {app_name}!',
        body: `Hello {name},\n\nWelcome to {app_name}! We're excited to have you on board.\n\nYour account has been created successfully. You can now start exploring our delicious food options.\n\nBest regards,\nThe {app_name} Team`,
        html: `
          <h2>Welcome to {app_name}!</h2>
          <p>Hello {name},</p>
          <p>Welcome to {app_name}! We're excited to have you on board.</p>
          <p>Your account has been created successfully. You can now start exploring our delicious food options.</p>
          <p>Best regards,<br>The {app_name} Team</p>
        `,
        type: 'welcome'
      },
      order_confirmation: {
        subject: 'Order Confirmation - #{order_id}',
        body: `Hello {name},\n\nYour order #{order_id} has been placed successfully!\n\nOrder Details:\n- Order ID: {order_id}\n- Total: {total}\n- Delivery Address: {address}\n\nWe'll notify you once your order is ready.\n\nBest regards,\nThe {app_name} Team`,
        html: `
          <h2>Order Confirmation</h2>
          <p>Hello {name},</p>
          <p>Your order #{order_id} has been placed successfully!</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p><strong>Order ID:</strong> {order_id}</p>
            <p><strong>Total:</strong> {total}</p>
            <p><strong>Delivery Address:</strong> {address}</p>
          </div>
          <p>We'll notify you once your order is ready.</p>
          <p>Best regards,<br>The {app_name} Team</p>
        `,
        type: 'order_confirmation'
      },
      password_reset: {
        subject: 'Password Reset Request',
        body: `Hello {name},\n\nYou requested to reset your password. Click the link below to reset your password:\n\n{reset_link}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe {app_name} Team`,
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello {name},</p>
          <p>You requested to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" class="btn">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The {app_name} Team</p>
        `,
        type: 'password_reset'
      },
      order_delivered: {
        subject: 'Order Delivered - #{order_id}',
        body: `Hello {name},\n\nGreat news! Your order #{order_id} has been delivered successfully.\n\nWe hope you enjoyed your meal. Please consider leaving a review to help us improve our service.\n\nThank you for choosing {app_name}!\n\nBest regards,\nThe {app_name} Team`,
        html: `
          <h2>Order Delivered!</h2>
          <p>Hello {name},</p>
          <p>Great news! Your order #{order_id} has been delivered successfully.</p>
          <p>We hope you enjoyed your meal. Please consider leaving a review to help us improve our service.</p>
          <p>Thank you for choosing {app_name}!</p>
          <p>Best regards,<br>The {app_name} Team</p>
        `,
        type: 'order_delivered'
      },
      promotion: {
        subject: 'Special Offer Just for You!',
        body: `Hello {name},\n\nWe have a special offer just for you!\n\n{offer_details}\n\nDon't miss out on this amazing deal. Order now and save big!\n\nBest regards,\nThe {app_name} Team`,
        html: `
          <h2>Special Offer Just for You!</h2>
          <p>Hello {name},</p>
          <p>We have a special offer just for you!</p>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3>🎉 Special Offer</h3>
            <p>{offer_details}</p>
          </div>
          <p>Don't miss out on this amazing deal. Order now and save big!</p>
          <p>Best regards,<br>The {app_name} Team</p>
        `,
        type: 'promotion'
      }
    };

    return templates[templateName];
  }

  /**
   * Log email notification to database
   */
  async logEmailNotification(emailData) {
    try {
      await EmailNotification.create(emailData);
    } catch (error) {
      console.error('Error logging email notification:', error);
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emailList, subject, body, options = {}) {
    const results = [];
    
    for (const email of emailList) {
      try {
        const result = await this.sendEmail(email.to, subject, body, {
          ...options,
          toName: email.name,
          user_id: email.user_id
        });
        results.push({ email: email.to, success: true, result });
      } catch (error) {
        results.push({ email: email.to, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get email statistics
   */
  async getEmailStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await EmailNotification.findAll({
      where: {
        created_at: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return stats;
  }
}

module.exports = new EmailService(); 