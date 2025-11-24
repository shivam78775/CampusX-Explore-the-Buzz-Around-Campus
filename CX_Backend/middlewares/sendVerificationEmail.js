const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

// =============================================
// Create a Mailtrap SMTP transporter (BEST OPTION)
// =============================================
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525, 
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
    });
};

// =============================================
// Send Verification Email
// =============================================
const sendVerificationEmail = async (email, name) => {
    const transporter = createEmailTransporter();

    const token = verificationToken(email);

    const verificationLink = `${process.env.BACK_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: "CampusX <no-reply@campusx.com>",
        to: email,
        subject: "Verify Your Email | CampusX",
        html: `
            <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #fafafa;">
                <h2 style="text-align: center; color: #111;">Verify Your Email Address</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Thanks for signing up on <strong>CampusX</strong>. Click the button below to verify your email.</p>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${verificationLink}" 
                    style="padding: 12px 20px; background: black; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        Verify Email
                    </a>
                </div>

                <p style="margin-top: 20px;">If the button doesn't work, copy this link:</p>
                <p>${verificationLink}</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
        console.error(`❌ Email sending failed:`, error);
    }
};

// =============================================
// Generate Email Verification Token
// =============================================
const verificationToken = (userEmail) => {
    return jwt.sign({ email: userEmail }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};

module.exports = { sendVerificationEmail, verificationToken };
