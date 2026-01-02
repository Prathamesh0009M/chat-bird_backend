import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();


export const auth = async (req, res, next) => {
    try {
        // Handle cases where req.cookies might be undefined
        let token = req.cookies?.token ||
                    req.body?.token ||
                    req.header("Authorization")?.replace("Bearer ", "");

        // Remove extra quotes if present
        if (token) {
            token = token.replace(/^"|"$/g, '');
        }

        console.log("🔑 Extracted Token:", token);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "token is missing",
            });
        }

        console.log("✅ Token received:", token);

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log("✅ Decoded data:", decode);
            req.user = decode;
        } catch (e) {
            console.log("❌ Token verification failed:", e.message);
            return res.status(401).json({
                success: false,
                message: "token is Invalid",
            });
        }

        next();
    } catch (e) {
        console.log("❌ Auth middleware error:", e);
        return res.status(401).json({
            success: false,
            message: "something went wrong while validating the token",
        });
    }
};  