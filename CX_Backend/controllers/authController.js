const jwt = require("jsonwebtoken");
const Users = require("../models/userModel.js"); // Ensure correct path
require("dotenv").config();

async function verifyTokenForEmail(req, res) {
    const token = req.body.token || req.query.token;

    // 👉 FIX: Check if token exists
    if (!token) {
        return res.status(400).send("❌ Token is missing");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Users.findOneAndUpdate(
            { email: decoded.email },
            { isEmailVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).send("❌ User Not Found");
        }

        return res.send("✅ Email Verified Successfully!");

    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(400).send("❌ Invalid or Expired Token");
    }
}


module.exports = { verifyTokenForEmail }; 
