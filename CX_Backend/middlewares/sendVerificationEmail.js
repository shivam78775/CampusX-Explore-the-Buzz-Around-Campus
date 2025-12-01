const Brevo = require("sib-api-v3-sdk");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================================
// Configure Brevo API
// ================================
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const brevo = new Brevo.TransactionalEmailsApi();

// ================================
// Send Verification Email
// ================================
const sendVerificationEmail = async (email, name) => {
    const token = verificationToken(email);
    const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}`;

    const emailData = {
        sender: {
            name: process.env.SENDER_NAME,
            email: process.env.SENDER_EMAIL
        },
        to: [{ email }],
        subject: "Verify Your Email | CampusX",
        htmlContent: `
            <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
                <h2>Verify Your Email Address</h2>
                <p>Hello <strong>${name}</strong>,</p>

                <a href="${verificationLink}" style="padding: 12px 20px; background: black; color: white; border-radius: 5px; text-decoration: none;">
                    Verify Email
                </a>

                <p>If the button doesn't work, copy this link:</p>
                <p>${verificationLink}</p>
            </div>
        `,
    };

    try {
        await brevo.sendTransacEmail(emailData);
        console.log(`✅ Verification email sent to ${email} by CampusX`);
        console.log("SENDER USED:", process.env.SENDER_EMAIL);
    } catch (error) {
        console.error("❌ Email API failed:", error.response?.body || error);
    }
};

// ================================
// Generate JWT Token
// ================================
const verificationToken = (userEmail) => {
    return jwt.sign({ email: userEmail }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};

module.exports = { sendVerificationEmail, verificationToken };
