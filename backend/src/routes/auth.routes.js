const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/login', authController.login);
router.post('/register', authenticateToken, requireRole('admin'), authController.register);
router.post('/refresh', authController.refreshToken);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
