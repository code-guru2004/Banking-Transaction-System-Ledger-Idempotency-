require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
      const info = await transporter.sendMail({
        from: `"ABC Bank of India" <${process.env.EMAIL_USER}>`, // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html, // html body
      });
  
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  
  // Registration mail
  async function sendRegistrationemail(userEmail, name) {
    const subject = "Welcome to ABC Bank of India";
    const text = `Hello ${name}`;
    const html=`<p>Thank you to join.</p>`

    await sendEmail(userEmail,subject, text, html);
  }

  // Transaction notification ( Successful )
  async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Successful";
    const text = `Hello ${name}, Your transaction of amount ${amount} to account ${toAccount} was successful.`;
    const html = `<p>Dear ${name},</p><p>Your transaction of amount <strong>${amount}</strong> to account <strong>${toAccount}</strong> was successful.</p><p>Thank you for banking with us.</p>`;

    await sendEmail(userEmail, subject, text, html);
  }

  // Email for failed transaction can also be implemented similarly by changing subject and content accordingly.
  async function sendFailedTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = "Transaction Failed";
    const text = `Hello ${name}, Your transaction of amount ${amount} to account ${toAccount} has failed. Please try again later.`;
    const html = `<p>Dear ${name},</p><p>Your transaction of amount <strong>${amount}</strong> to account <strong>${toAccount}</strong> has failed. Please try again later.</p><p>Thank you for banking with us.</p>`;

    await sendEmail(userEmail, subject, text, html);

  }

  module.exports = { sendRegistrationemail, sendTransactionEmail, sendFailedTransactionEmail };