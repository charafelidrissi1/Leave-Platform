const router = require('express').Router();
const usersController = require('../controllers/users.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', requireRole('admin'), usersController.getAllUsers);
router.get('/team', requireRole('manager', 'admin'), usersController.getTeam);
router.get('/managers', usersController.getManagers);
router.get('/:id', requireRole('admin', 'manager'), usersController.getUserById);
router.put('/:id', requireRole('admin'), usersController.updateUser);

module.exports = router;
