import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT
  ? parseInt(process.env.SMTP_PORT, 10)
  : 587;
const mailSender = process.env.MAIL_SENDER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  if (!smtpHost || !mailSender || !smtpPass) {
    throw new Error(
      "SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS."
    );
  }
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: mailSender,
      pass: smtpPass,
    },
  });
  return transporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<void> {
  const tx = getTransporter();
  await tx.sendMail({
    from: mailSender,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const subject = "Your TrueChance verification code";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Verify your email</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This code will expire soon. If you didn't request this, please ignore this email.</p>
    </div>
  `;
  const text = `Your verification code is: ${otp}`;
  await sendEmail({ to, subject, html, text });
}
