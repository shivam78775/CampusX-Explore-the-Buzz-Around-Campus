const Brevo = require("@getbrevo/brevo");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================================
// Configure Brevo API (NEW SDK)
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
        sender: { name: "CampusX", email: "no-reply@campusx.com" },
        to: [{ email }],
        subject: "Verify Your Email | CampusX",
        htmlContent: `
            <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #fafafa;">
                <h2 style="text-align: center;">Verify Your Email Address</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Click the button below to verify your email:</p>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${verificationLink}"
                       style="padding: 12px 20px; background: black; color: white; border-radius: 5px; text-decoration: none;">
                        Verify Email
                    </a>
                </div>

                <p style="margin-top: 20px;">If the button doesn't work, copy this link:</p>
                <p>${verificationLink}</p>
            </div>
        `,
    };

    try {
        await brevo.sendTransacEmail(emailData);
        console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
        console.error("❌ Email API failed:", error.response?.body || error);
    }
};

// ================================
// Generate Token
// ================================
const verificationToken = (userEmail) => {
    return jwt.sign({ email: userEmail }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};

module.exports = { sendVerificationEmail, verificationToken };
