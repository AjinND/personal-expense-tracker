import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter (configure based on your email service)
const createTransporter = () => {
  if (process.env.NODE_ENV !== 'development') {
    // Production email configuration
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - use console.log or ethereal email
    return {
      sendMail: async (options: any) => {
        console.log('📧 Email sent (dev mode):', {
          to: options.to,
          subject: options.subject,
          preview: options.html.substring(0, 100) + '...'
        });
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Expense Tracker'}" <${process.env.EMAIL_FROM || 'noreply@expensetracker.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};