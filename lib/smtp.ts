import nodemailer from "nodemailer";

type SmtpPayload = {
  subject: string;
  text: string;
  html?: string;
};

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export async function sendSmtpMessage({ subject, text, html }: SmtpPayload) {
  const host = process.env.SMTP_HOST;
  const port = toNumber(process.env.SMTP_PORT, 587);
  const secure = process.env.SMTP_SECURE === "1";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const to = process.env.SMTP_TO;

  if (!host || !user || !pass || !from || !to) {
    throw new Error("SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM/SMTP_TO)");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
