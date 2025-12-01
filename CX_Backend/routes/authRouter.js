const express = require("express");
const { verifyTokenForEmail } = require("../controllers/authController.js");

const authRouter = express.Router();

authRouter.post("/verify-token", verifyTokenForEmail);

authRouter.get("/verify-email", verifyTokenForEmail);

module.exports = authRouter;
