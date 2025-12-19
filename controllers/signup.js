import User from "../module/user.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      preferredLanguage,
      phoneNumber
    } = req.body;

    console.log("DATA: ", name,
      
      email,
      password,
      preferredLanguage,);
    
    // ===== VALIDATION =====
    if (!name || !email || !password ) {
      return res.status(400).json({
        success: false,
        message: "name, username, email, and password are required"
      });
    }

    // Email exists?
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    

    // Phone number exists?
    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: "User with this phone number already exists"
        });
      }
    }

    // ===== HASH PASSWORD =====
    const hashedPassword = await bcrypt.hash(password, 10);

    // ===== CREATE USER =====
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      preferredLanguage: preferredLanguage || "en",
      phoneNumber: phoneNumber || null,

      // Default values from schema will automatically apply:
      // avatar, coverPhoto, avatarColor, bio, status, storageUsed, etc.
    });

    await newUser.save();

    // ===== RESPONSE =====
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        preferredLanguage: newUser.preferredLanguage,
        avatar: newUser.avatar,
        coverPhoto: newUser.coverPhoto,
        bio: newUser.bio,
        status: newUser.status,
        initials: newUser.initials, // Virtual field
        storageUsed: newUser.storageUsed,
        storageLimit: newUser.storageLimit,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration"
    });
  }
};


export const login = async (req, res) => {
  try {
    // get data from req body 
    const { email, password } = req.body;

    // validation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check existence of user 
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not registered. Please sign-up first.",
      });
    }

    // generate JWT token after password matching
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 24 hours
        httpOnly: true,
      };

      console.log(user);
      // create cookie and send response 
      return res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in Successfully",
      });

    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (e) {
    console.log("Login problem ", e);
    return res.status(501).json({
      success: false,
      message: e.message,
    });
  }
};