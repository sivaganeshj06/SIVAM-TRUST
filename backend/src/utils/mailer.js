const nodemailer = require('nodemailer');
const auditLogger = require('./logger');

// Setup SMTP Transporter dynamically based on env
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    });
  }
  return null;
};

const sendMail = async (options) => {
  const transporter = getTransporter();
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Sivam Trust Support" <no-reply@sivamtrust.org>',
        to: options.to,
        subject: options.subject,
        html: options.html
      });
      auditLogger.info('EMAIL_SENT', { messageId: info.messageId, to: options.to });
      return true;
    } catch (err) {
      auditLogger.error('EMAIL_FAILED', { error: err.message, to: options.to });
      return false;
    }
  } else {
    // Log to console/audit for local development when SMTP is not configured
    console.log(`[EMAIL DEV FALLBACK] To: ${options.to}\nSubject: ${options.subject}\nContent:\n${options.html}\n-------------------------`);
    auditLogger.info('EMAIL_LOGGED', { to: options.to, subject: options.subject });
    return true;
  }
};

const sendLoginNotification = async ({ name, role, loginTime, device, ip }) => {
  // Replace with actual founder email if needed
  const founderEmail = process.env.FOUNDER_EMAIL || 'founder@sivamtrust.org';
  
  return sendMail({
    to: founderEmail,
    subject: `⚠️ Login Alert: ${name} (${role})`,
    html: `
      <h3>Sivam Trust Security Login Notification</h3>
      <p>A login event occurred on your account:</p>
      <ul>
        <li><b>Name:</b> ${name}</li>
        <li><b>Role:</b> ${role}</li>
        <li><b>Time:</b> ${loginTime}</li>
        <li><b>Device:</b> ${device || 'Unknown'}</li>
        <li><b>IP Address:</b> ${ip || 'Unknown'}</li>
      </ul>
      <p>If this wasn't you, please reset your password immediately.</p>
    `
  });
};

const sendDonationNotification = async ({ donor_name, email, phone, amount, payment_status }) => {
  const staffEmail = process.env.STAFF_EMAIL || 'notifications@sivamtrust.org';
  
  return sendMail({
    to: staffEmail,
    subject: `💰 New Donation Pending: ₹${amount}`,
    html: `
      <h3>New Donation Registered</h3>
      <ul>
        <li><b>Donor Name:</b> ${donor_name}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Phone:</b> ${phone || '-'}</li>
        <li><b>Amount:</b> ₹${amount}</li>
        <li><b>Payment Status:</b> ${payment_status}</li>
      </ul>
    `
  });
};

const sendPasswordResetEmail = async (email, resetLink) => {
  return sendMail({
    to: email,
    subject: '🔑 Password Reset Request',
    html: `
      <h3>Sivam Trust Password Reset Request</h3>
      <p>You requested a password reset. Click the link below to set a new password. This link is valid for 15 minutes.</p>
      <p><a href="${resetLink}" style="padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
      <p>Or copy this link into your browser: <br>${resetLink}</p>
      <p>If you did not request this, please ignore this email.</p>
    `
  });
};

const sendGenericNotificationEmail = async (email, { title, message }) => {
  return sendMail({
    to: email,
    subject: `🔔 Trust Portal: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2563eb; margin-top: 0; font-weight: 800;">Sivam Trust Foundation</h2>
        <h3 style="color: #0f172a; font-weight: 700; margin-bottom: 12px;">${title}</h3>
        <p style="color: #334155; line-height: 1.6; font-size: 15px; margin: 0 0 20px;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is an automated notification from the Sivam Trust Enterprise Portal. Please do not reply directly to this email.</p>
      </div>
    `
  });
};

module.exports = {
  sendLoginNotification,
  sendDonationNotification,
  sendPasswordResetEmail,
  sendGenericNotificationEmail
};
