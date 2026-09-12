const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background: #0f0f1a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e1e3a 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
    .logo { font-size: 36px; margin-bottom: 16px; }
    .body { padding: 40px 32px; }
    .body p { color: #94a3b8; line-height: 1.7; font-size: 15px; margin: 0 0 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 24px 0; letter-spacing: 0.3px; }
    .footer { padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; }
    .footer p { color: #475569; font-size: 12px; margin: 0; }
    .highlight { color: #818cf8; font-weight: 600; }
    .info-box { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .info-box p { margin: 0; color: #a5b4fc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💼</div>
      <h1>FreelanceHub</h1>
      <p>Your Professional Freelance Marketplace</p>
    </div>
    <div class="body">
      <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:22px;">${title}</h2>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FreelanceHub. All rights reserved.</p>
      <p style="margin-top:8px;">If you didn't request this, please ignore this email or <a href="#" style="color:#818cf8">contact support</a>.</p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'FreelanceHub'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw new Error('Email could not be sent');
  }
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  const content = `
    <p>Hi <span class="highlight">${user.name}</span>,</p>
    <p>Welcome to FreelanceHub! Please verify your email address to get started.</p>
    <div class="info-box"><p>This link expires in <strong>24 hours</strong>.</p></div>
    <center><a href="${verifyUrl}" class="btn">✅ Verify Email Address</a></center>
    <p>Or copy this link: <span class="highlight">${verifyUrl}</span></p>
  `;
  return sendEmail({ to: user.email, subject: '✅ Verify Your FreelanceHub Account', html: emailTemplate('Verify Your Email', content) });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const content = `
    <p>Hi <span class="highlight">${user.name}</span>,</p>
    <p>You requested to reset your password. Click the button below to create a new password.</p>
    <div class="info-box"><p>This link expires in <strong>1 hour</strong>.</p></div>
    <center><a href="${resetUrl}" class="btn">🔐 Reset Password</a></center>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return sendEmail({ to: user.email, subject: '🔐 Reset Your FreelanceHub Password', html: emailTemplate('Reset Password', content) });
};

const sendApplicationNotification = async (client, freelancer, project) => {
  const content = `
    <p>Hi <span class="highlight">${client.name}</span>,</p>
    <p><strong>${freelancer.name}</strong> has submitted a proposal for your project:</p>
    <div class="info-box"><p><strong>${project.title}</strong></p></div>
    <center><a href="${process.env.CLIENT_URL}/client/applications" class="btn">📋 View Proposal</a></center>
  `;
  return sendEmail({ to: client.email, subject: `📋 New Proposal for "${project.title}"`, html: emailTemplate('New Proposal Received', content) });
};

const sendApplicationStatusEmail = async (freelancer, project, status) => {
  const emoji = status === 'accepted' ? '🎉' : '📋';
  const content = `
    <p>Hi <span class="highlight">${freelancer.name}</span>,</p>
    <p>Your proposal for the project <strong>"${project.title}"</strong> has been <strong>${status}</strong>.</p>
    <center><a href="${process.env.CLIENT_URL}/freelancer/applications" class="btn">${emoji} View Details</a></center>
  `;
  return sendEmail({ to: freelancer.email, subject: `${emoji} Proposal ${status} - ${project.title}`, html: emailTemplate(`Proposal ${status.charAt(0).toUpperCase() + status.slice(1)}`, content) });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendApplicationNotification, sendApplicationStatusEmail };
