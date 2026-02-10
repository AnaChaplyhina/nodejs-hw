import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'node:fs/promises';
import path from 'node:path';
import createHttpError from 'http-errors';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (options) => {
  try {
    const { to, subject, template, context } = options;

    const templatePath = path.resolve('src/templates', `${template}.html`);
    const templateSource = await fs.readFile(templatePath, 'utf-8');

    const compiledTemplate = handlebars.compile(templateSource);
    const html = compiledTemplate(context);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw createHttpError(500, 'Failed to send the email, please try again later.');
  }
};
