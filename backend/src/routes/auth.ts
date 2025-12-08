/**
 * Authentication routes for signup and login.
 * Connects controller logic to Express endpoints.
 */

import { Router } from 'express';
import { signup, login } from '../controllers/authController';

const router = Router();

// POST /api/signup - User registration
router.post('/signup', signup);

// POST /api/login - User login
router.post('/login', login);

export default router;
