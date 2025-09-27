import nodemailer from 'nodemailer';

// 1. Create a Nodemailer transporter
// ===================================
// For a real app, use a robust email service like SendGrid, Mailgun, or AWS SES.
// The configuration should be stored securely in environment variables.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: (process.env.EMAIL_SECURE === 'true'), // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration for development purposes
transporter.verify(function (error, success) {
    if (error) {
      console.error("Email transporter configuration error:", error);
    } else {
      console.log("Email server is ready to take our messages");
    }
});

// 2. Define Email Sending Functions
// ===================================

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * A generic function to send an email.
 */
const sendEmail = async (mailOptions: MailOptions) => {
  try {
    await transporter.sendMail({
      from: `"Qiyal AI" <${process.env.EMAIL_FROM || 'noreply@qiyal.ai'}>`,
      ...mailOptions,
    });
    console.log(`Email sent to ${mailOptions.to}`);
  } catch (error) {
    console.error(`Failed to send email to ${mailOptions.to}:`, error);
  }
};

/**
 * Sends a notification to a freelancer when they receive a new review.
 */
export const sendNewReviewNotification = async (
    freelancerEmail: string,
    reviewerName: string,
    projectName: string,
    rating: number
) => {
    const subject = `You've received a new review for ${projectName}!`;
    const text = `Hi, ${reviewerName} has left a ${rating}-star review for your work on the project "${projectName}". Log in to Qiyal.ai to see the details.`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>New Review on Qiyal.ai!</h2>
            <p>Hi there,</p>
            <p><strong>${reviewerName}</strong> has left you a <strong>${rating}-star review</strong> for your work on the project: <strong>"${projectName}"</strong>.</p>
            <p>Log in to your dashboard to see the full review and feedback.</p>
            <br/>
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View My Dashboard</a>
            <br/>
            <p>Keep up the great work!</p>
            <p>- The Qiyal AI Team</p>
        </div>
    `;

    await sendEmail({
        to: freelancerEmail,
        subject,
        text,
        html,
    });
};

// ... You can add more notification functions here, e.g., sendProjectCompletedNotification, sendNewBidNotification, etc.