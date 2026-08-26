import { config } from '../config';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!config.resend.apiKey || config.resend.apiKey === 'your_resend_api_key') {
      logger.warn(`Email not sent (no API key configured): ${options.subject} to ${options.to}`);
      return false;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(config.resend.apiKey);

    const { error } = await resend.emails.send({
      from: config.resend.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      logger.error('Email send error:', error);
      return false;
    }

    logger.info(`Email sent: ${options.subject} to ${options.to}`);
    return true;
  } catch (error) {
    logger.error('Email send error:', error);
    return false;
  }
};

export const emailTemplates = {
  contactReceived: (data: { name: string; email: string; message: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E3A5F;">New Contact Message</h2>
      <p><strong>From:</strong> ${data.name} (${data.email})</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
        ${data.message}
      </div>
    </div>
  `,

  courseEnrollment: (data: { studentName: string; courseTitle: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E3A5F;">Course Enrollment Confirmed</h2>
      <p>Dear ${data.studentName},</p>
      <p>You have successfully enrolled in <strong>${data.courseTitle}</strong>.</p>
      <p>Start learning today!</p>
    </div>
  `,

  passwordReset: (data: { name: string; resetLink: string }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E3A5F;">Password Reset Request</h2>
      <p>Dear ${data.name},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${data.resetLink}" style="background: #C9A84C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
    </div>
  `,
};
