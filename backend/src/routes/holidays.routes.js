const router = require('express').Router();
const holidaysController = require('../controllers/holidays.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', holidaysController.getHolidays);
router.post('/', requireRole('admin'), holidaysController.addHoliday);
router.post('/seed', requireRole('admin'), holidaysController.seedHolidays);
router.delete('/:id', requireRole('admin'), holidaysController.deleteHoliday);

module.exports = router;
