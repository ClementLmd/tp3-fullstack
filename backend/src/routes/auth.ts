/**
 * Authentication routes for signup and login.
 * Connects controller logic to Express endpoints.
 */

import { Router } from "express";
import { signup, login, logout } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// POST /auth/signup - User registration
router.post("/signup", signup);

// POST /auth/login - User login
router.post("/login", login);

// POST /auth/logout - User logout (requires authentication)
router.post("/logout", authenticateToken, logout);

export default router;
