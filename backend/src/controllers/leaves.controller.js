const db = require('../config/database');
const leaveService = require('../services/leave.service');
const { calculateWorkingDays } = require('../utils/workingDays');

async function submitLeave(req, res) {
  try {
    const { leaveTypeId, startDate, endDate, reason, documentUrl } = req.body;
    const result = await leaveService.submitLeaveRequest({
      userId: req.user.id,
      leaveTypeId,
      startDate,
      endDate,
      reason,
      documentUrl,
    });
    res.status(201).json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server error' });
  }
}

async function getMyLeaves(req, res) {
  try {
    const { status, year } = req.query;
    let query = `SELECT lr.*, lt.name_en, lt.name_fr, lt.name_ar, lt.category
                 FROM leave_requests lr
                 JOIN leave_types lt ON lt.id = lr.leave_type_id
                 WHERE lr.user_id = $1`;
    const params = [req.user.id];
    let paramIdx = 2;

    if (status) {
      query += ` AND lr.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }
    if (year) {
      query += ` AND EXTRACT(YEAR FROM lr.start_date) = $${paramIdx}`;
      params.push(year);
      paramIdx++;
    }
    query += ' ORDER BY lr.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getPendingApprovals(req, res) {
  try {
    const result = await db.query(
      `SELECT lr.*, lt.name_en, lt.name_fr, lt.name_ar, lt.category, u.name as employee_name, u.email as employee_email
       FROM leave_requests lr
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       JOIN users u ON u.id = lr.user_id
       WHERE lr.status = 'pending' AND u.manager_id = $1
       ORDER BY lr.created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getAllLeaves(req, res) {
  try {
    const { status, userId, year } = req.query;
    let query = `SELECT lr.*, lt.name_en, lt.name_fr, lt.name_ar, lt.category, u.name as employee_name
                 FROM leave_requests lr
                 JOIN leave_types lt ON lt.id = lr.leave_type_id
                 JOIN users u ON u.id = lr.user_id
                 WHERE 1=1`;
    const params = [];
    let paramIdx = 1;

    if (status) {
      query += ` AND lr.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }
    if (userId) {
      query += ` AND lr.user_id = $${paramIdx}`;
      params.push(userId);
      paramIdx++;
    }
    if (year) {
      query += ` AND EXTRACT(YEAR FROM lr.start_date) = $${paramIdx}`;
      params.push(year);
      paramIdx++;
    }
    query += ' ORDER BY lr.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function approveLeave(req, res) {
  try {
    const result = await leaveService.approveLeaveRequest(
      parseInt(req.params.id),
      req.user.id,
      req.body.comment
    );
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server error' });
  }
}

async function rejectLeave(req, res) {
  try {
    const result = await leaveService.rejectLeaveRequest(
      parseInt(req.params.id),
      req.user.id,
      req.body.comment
    );
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server error' });
  }
}

async function cancelLeave(req, res) {
  try {
    const result = await leaveService.cancelLeaveRequest(
      parseInt(req.params.id),
      req.user.id
    );
    res.json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server error' });
  }
}

async function previewDays(req, res) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }
    const days = await calculateWorkingDays(startDate, endDate);
    const conflicts = await leaveService.getTeamConflicts(req.user.id, startDate, endDate);
    res.json({ workingDays: days, conflicts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getLeaveTypes(req, res) {
  try {
    const result = await db.query('SELECT * FROM leave_types WHERE is_active = true ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  submitLeave,
  getMyLeaves,
  getPendingApprovals,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  previewDays,
  getLeaveTypes,
};
