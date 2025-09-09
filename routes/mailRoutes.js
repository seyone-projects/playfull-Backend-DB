const nodemailer = require("nodemailer");

// Function to send email with HTML content using nodemailer
async function sendHtmlEmail(to, subject, htmlContent) {
  var userPassword = "ajblcjcxmnnhkqcm";
  var userEmail = "kingphoenixsolutions@gmail.com";
  const nodemailer = require('nodemailer');

  // Create reusable transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: userEmail, // Your email address
      pass: userPassword // Your email password or app-specific password
    }
  });

  // Setup email data
  const mailOptions = {
    from: '"Playful Pencil"', // Sender address
    to: to, // List of receivers
    subject: subject, // Subject line
    html: htmlContent // HTML body content
  };

  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}


module.exports = { sendHtmlEmail };
