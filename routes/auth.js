const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

// Signup
router.post('/signup', authController.signup);

// Login
router.post('/login', authController.login);

module.exports = router;
