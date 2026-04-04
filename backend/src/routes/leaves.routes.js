const router = require('express').Router();
const leavesController = require('../controllers/leaves.controller');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/types', leavesController.getLeaveTypes);
router.get('/preview', leavesController.previewDays);
router.post('/', leavesController.submitLeave);
router.get('/my', leavesController.getMyLeaves);
router.get('/pending', requireRole('manager', 'admin'), leavesController.getPendingApprovals);
router.get('/all', requireRole('admin'), leavesController.getAllLeaves);
router.patch('/:id/approve', requireRole('manager', 'admin'), leavesController.approveLeave);
router.patch('/:id/reject', requireRole('manager', 'admin'), leavesController.rejectLeave);
router.delete('/:id', leavesController.cancelLeave);

module.exports = router;
