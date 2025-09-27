import nodemailer from 'nodemailer';

// 1. Lazy-initialize the Nodemailer transporter
// =============================================

let transporter: nodemailer.Transporter | null = null;
let transporterPromise: Promise<nodemailer.Transporter | null> | null = null;

const getTransporter = (): Promise<nodemailer.Transporter | null> => {
    // If we're in a test environment, don't initialize the transporter.
    if (process.env.NODE_ENV === 'test') {
        return Promise.resolve(null);
    }

    // If the promise already exists, return it to avoid re-initializing.
    if (transporterPromise) {
        return transporterPromise;
    }

    // Create a new promise for initialization.
    transporterPromise = new Promise((resolve) => {
        // For a real app, use a robust email service like SendGrid, Mailgun, or AWS SES.
        // The configuration should be stored securely in environment variables.
        const newTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.EMAIL_PORT || '587', 10),
            secure: (process.env.EMAIL_SECURE === 'true'), // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Verify connection configuration.
        newTransporter.verify((error) => {
            if (error) {
                console.error("Email transporter configuration error:", error);
                // In case of error, resolve with null to prevent sending emails.
                resolve(null);
            } else {
                console.log("Email server is ready to take our messages");
                transporter = newTransporter;
                resolve(transporter);
            }
        });
    });

    return transporterPromise;
};

// Initialize the transporter when the app starts, but not in a test environment.
getTransporter();


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
  const emailTransporter = await getTransporter();

  if (!emailTransporter) {
    console.log(`Email sending is disabled. Would have sent to ${mailOptions.to} with subject "${mailOptions.subject}"`);
    return; // Silently fail in test env or if config is bad
  }

  try {
    await emailTransporter.sendMail({
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