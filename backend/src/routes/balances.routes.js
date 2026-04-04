const router = require('express').Router();
const balancesController = require('../controllers/balances.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/my', balancesController.getMyBalances);
router.get('/user/:id', requireRole('manager', 'admin'), balancesController.getUserBalances);
router.put('/user/:id', requireRole('admin'), balancesController.adjustBalance);
router.post('/recalculate', requireRole('admin'), balancesController.recalculate);

module.exports = router;
