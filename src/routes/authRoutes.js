const router = require('express').Router();
const authController = require('../controllers/authController');

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       '201':
 *         description: Registered user and token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       '400':
 *         description: Missing or invalid fields
 *       '409':
 *         description: Email already registered
 *
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '200':
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       '400':
 *         description: Missing credentials
 *       '401':
 *         description: Invalid credentials
 */
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/token-checker', authController.TokenChecker);

module.exports = router;