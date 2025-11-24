const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const cloudinary = require('../config/cloudinary');
const { sendVerificationEmail } = require("../middlewares/sendVerificationEmail");
const userModel = require("../models/userModel");
const postModel = require("../models/postModel");

async function register(req, res) {
  const { name, username, email, password } = req.body;

  try {
    const lowerName = name.toLowerCase();
    const lowerEmail = email.toLowerCase();
    const lowerUsername = username.toLowerCase();

    if (!password || password.length < 6) {
      return res.status(400).send({ message: "Password must be at least 6 characters long" });
    }

    const existingEmail = await userModel.findOne({ email: lowerEmail });

    // ✅ If email exists and is verified
    if (existingEmail && existingEmail.isEmailVerified) {
      return res.status(400).send({ message: `Email: ${lowerEmail} already exists` });
    }

    // ✅ If user exists but not verified
    if (existingEmail && !existingEmail.isEmailVerified) {
      // Check if the username is taken by someone else (excluding this user)
      const usernameTaken = await userModel.findOne({
        username: lowerUsername,
        _id: { $ne: existingEmail._id }
      });

      if (usernameTaken) {
        return res.status(400).send({ message: `Username: ${lowerUsername} is already taken` });
      }

      existingEmail.name = lowerName;
      existingEmail.username = lowerUsername;
      existingEmail.password = await bcrypt.hash(password, 10);
      existingEmail.resetToken = null;
      existingEmail.resetTokenExpiry = null;
      existingEmail.createdAt = new Date(); // Update timestamp
      await existingEmail.save();

      await sendVerificationEmail(lowerEmail, lowerName);
      return res.status(200).send({ message: "Verification email resent. Please verify your account." });
    }

    // ✅ Check username availability for new user
    const usernameExists = await userModel.findOne({ username: lowerUsername });
    if (usernameExists) {
      return res.status(400).send({ message: `Username: ${lowerUsername} already exists` });
    }

    // ✅ Register new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      name: lowerName,
      username: lowerUsername,
      email: lowerEmail,
      password: hashedPassword,
      isEmailVerified: false,
      createdAt: new Date(), // store creation time
    });

    await newUser.save();
    await sendVerificationEmail(lowerEmail, lowerName);

    return res.status(200).send({ message: "Verification email sent. Please verify your account." });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Server error", error });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ message: "Email not verified, Go back to signup page to register!" })
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,         // Required for HTTPS
      sameSite: "None",     // Required for cross-site
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    // Send response
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

function logOut(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.status(200).send({ message: "Logged out successfully" });
};

async function verifyUser(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // ✅ Set req.user so next middleware can access it
    next(); // ✅ Call next() to continue to createPost
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function resetPasswordRequest(req, res) {
  const { email } = req.body;

  try {
    const lowerEmail = email.toLowerCase();
    const user = await userModel.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).send({ message: "User Not Found" });
    }

    const resetToken = jwt.sign({ email: lowerEmail }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: lowerEmail,
      subject: "Reset Your Password",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <h2>Password Reset Request</h2>
                    <p>Click the link below to reset your password. The link will expire in 15 minutes:</p>
                    <a href="${resetLink}" style="background:black; color: white; padding: 10px 20px; text-decoration: none;">
                        Reset Password
                    </a>
                </div>
            `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).send({ message: "Password reset link sent to your email" });

  } catch (error) {
    console.error("Reset Password Request Error:", error);
    return res.status(500).send({ message: "Error sending password reset email", error });
  }
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).send({ message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).send({ message: "Password must be at least 6 characters" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const user = await userModel.findOne({
      email: decoded.email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      console.error("User not found or token expired");
      return res.status(400).send({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    try {
      await user.save();
      return res.status(200).send({ message: "Password reset successfully" });
    } catch (saveError) {
      console.error("Error saving user:", saveError);
      return res.status(500).send({ message: "Error saving user", error: saveError });
    }

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).send({ message: "Token has expired" });
    }
    console.error("Reset Password Error:", error);
    return res.status(500).send({ message: "Internal Server Error", error });
  }
}

async function getUserProfile(req, res) {
  try {
    const { username } = req.params;

    const user = await userModel.findOne({ username })
      .select('username name profilepic coverpic bio followers following posts')
      .populate('posts', '_id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await postModel.find({ user: user._id })
      .sort({ date: -1 })
      .select('_id content postpic likes comments date createdAt isAnonymous');

    // Filter out anonymous posts for display
    const nonAnonymousPosts = posts.filter(post => !post.isAnonymous);

    const formattedPosts = nonAnonymousPosts.map(post => ({
      _id: post._id,
      caption: post.content,
      postpic: post.postpic,
      likes: post.likes.length,
      commentsCount: post.comments.length,
      createdAt: post.createdAt
    }));

    const isFollowing = user.followers.includes(req.user._id);

    return res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        profilepic: user.profilepic,
        coverpic: user.coverpic,
        bio: user.bio,
        postsCount: nonAnonymousPosts.length, // Only count non-anonymous posts
        followersCount: user.followers.length,
        followingCount: user.following.length
      },
      posts: formattedPosts,
      isFollowing,
      loggedInUserId: req.user._id // ✅ this helps frontend conditionally show follow button
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({ message: 'Server error' });
  }
}


async function searchUser(req, res) {
  const { username } = req.query;
  if (!username) return res.json([]);

  try {
    console.log("🔍 Searching for username:", username);

    const users = await userModel.find({
      username: { $regex: username.trim(), $options: 'i' }, // 👈 Partial + case-insensitive
    }).select("username name profilepic");

    console.log("✅ Users found:", users.length);
    res.json(users);
  } catch (err) {
    console.error("❌ Error searching user:", err);
    res.status(500).json([]);
  }
}

async function loggedInUserProfile(req, res) {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Error fetching logged-in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user._id;
    const user = await userModel.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.files?.profilepic?.[0]?.path) {
      user.profilepic = req.files.profilepic[0].path;
    }

    if (req.files?.coverpic?.[0]?.path) {
      user.coverpic = req.files.coverpic[0].path;
    }

    if (name) user.name = name;
    if (bio) user.bio = bio;

    await user.save();

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Follow a user
async function toggleFollow(req, res) {
  const currentUserId = req.user._id;
  const targetUserId = req.params.id;

  if (currentUserId.toString() === targetUserId) {
    return res.status(400).json({ message: "You can't follow yourself." });
  }

  try {
    const currentUser = await userModel.findById(currentUserId);
    const targetUser = await userModel.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User to follow not found." });
    }

    const isFollowing = currentUser.following.includes(targetUserId);
    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
      await currentUser.save();
      await targetUser.save();
      return res.status(200).json({ success: true, message: "User unfollowed.", isFollowing: false });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      // Create notification for follow
      const Notification = require("../models/notification");
      const io = req.app.get("io");

      const notification = await Notification.create({
        sender: currentUserId,
        receiver: targetUserId,
        type: "follow"
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "username profilepic");

      io.to(targetUserId).emit("new_notification", populatedNotification);

      return res.status(200).json({ success: true, message: "User followed.", isFollowing: true });
    }

  } catch (error) {
    console.error("Toggle follow error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// Get following list
async function getFollowing(req, res) {
  try {
    const currentUser = await userModel.findById(req.user._id)
      .populate("following", "username name profilepic");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(currentUser.following);
  } catch (err) {
    console.error("Error fetching following list:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// Get followers list
async function getFollowers(req, res) {
  try {
    const currentUser = await userModel.findById(req.user._id).populate("followers", "username name profilePic");
    res.status(200).json(currentUser.followers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get total likes across all posts
async function getTotalLikes(req, res) {
  try {
    const posts = await postModel.find({ user: req.user._id });
    const totalLikes = posts.reduce((acc, post) => acc + (post.likes?.length || 0), 0);
    res.status(200).json({ totalLikes });
  } catch (err) {
    console.error("Error fetching likes:", err);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { register, verifyUser, login, logOut, resetPasswordRequest, resetPassword, getUserProfile, searchUser, loggedInUserProfile, toggleFollow, getFollowing, getFollowers, getTotalLikes, updateProfile };
