import express from "express";
import { signup } from "../controllers/signup.js"; // <-- make sure this path is correct
import {login}  from "../controllers/signup.js"; // <-- make sure this path is correct

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", signup);
router.post("/login", login);


export default router;
