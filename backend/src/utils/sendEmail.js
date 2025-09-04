import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. Create a transporter (e.g., using Gmail, SendGrid, Mailgun)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT, // 587 for TLS, 465 for SSL
        secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
      
    });

    // 2. Define the email options
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.email,
        subject: options.subject,
        html: options.message, 
    
    };

    // 3. Send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error(`Error sending email to ${options.email}:`, error);
      
        throw new Error('Failed to send email.'); 
    }
};

export default sendEmail;