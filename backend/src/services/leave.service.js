const db = require('../config/database');
const { calculateWorkingDays } = require('../utils/workingDays');
const notificationService = require('./notification.service');

async function submitLeaveRequest({ userId, leaveTypeId, startDate, endDate, reason, documentUrl }) {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // 1. Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw { status: 400, message: 'End date must be after start date' };
    }

    // 2. Calculate working days (excludes Sundays + Moroccan holidays)
    const requestedDays = await calculateWorkingDays(startDate, endDate);
    if (requestedDays <= 0) {
      throw { status: 400, message: 'No working days in the selected range' };
    }

    // 3. Get leave type info
    const typeResult = await client.query(
      'SELECT * FROM leave_types WHERE id = $1 AND is_active = true',
      [leaveTypeId]
    );
    if (typeResult.rows.length === 0) {
      throw { status: 400, message: 'Invalid leave type' };
    }
    const leaveType = typeResult.rows[0];

    // 4. Check document requirement
    if (leaveType.requires_document && !documentUrl) {
      // For sick leave, only require doc if > 4 days
      if (leaveType.category === 'sick' && requestedDays <= 4) {
        // OK, no doc needed for ≤4 sick days
      } else {
        throw { status: 400, message: 'Document required for this leave type' };
      }
    }

    // 5. Check balance (for annual and sick leave)
    if (['annual', 'sick'].includes(leaveType.category)) {
      const balanceResult = await client.query(
        `SELECT * FROM leave_balances 
         WHERE user_id = $1 AND leave_type_id = $2 AND year = EXTRACT(YEAR FROM $3::date)
         FOR UPDATE`,
        [userId, leaveTypeId, startDate]
      );
      
      if (balanceResult.rows.length === 0) {
        throw { status: 400, message: 'No leave balance found for this year' };
      }
      
      const balance = balanceResult.rows[0];
      if (requestedDays > parseFloat(balance.remaining)) {
        throw { 
          status: 409, 
          message: `Insufficient balance. Requested: ${requestedDays}, Remaining: ${balance.remaining}` 
        };
      }
    }

    // 6. Check for overlapping requests
    const overlapResult = await client.query(
      `SELECT id FROM leave_requests 
       WHERE user_id = $1 AND status IN ('pending', 'approved')
       AND start_date <= $3 AND end_date >= $2`,
      [userId, startDate, endDate]
    );
    if (overlapResult.rows.length > 0) {
      throw { status: 409, message: 'You already have a leave request for overlapping dates' };
    }

    // 7. Create the request
    const insertResult = await client.query(
      `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, requested_days, reason, document_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, leaveTypeId, startDate, endDate, requestedDays, reason, documentUrl]
    );
    const request = insertResult.rows[0];

    await client.query('COMMIT');

    // 8. Notify manager (async, don't block)
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const employee = userResult.rows[0];
    
    if (employee.manager_id) {
      const managerResult = await db.query('SELECT * FROM users WHERE id = $1', [employee.manager_id]);
      if (managerResult.rows[0]) {
        notificationService.notifyLeaveSubmitted(request, employee, managerResult.rows[0]).catch(console.error);
      }
    }

    return request;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function approveLeaveRequest(requestId, reviewerId, comment) {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Get the request
    const reqResult = await client.query(
      'SELECT * FROM leave_requests WHERE id = $1 AND status = $2 FOR UPDATE',
      [requestId, 'pending']
    );
    if (reqResult.rows.length === 0) {
      throw { status: 404, message: 'Request not found or not pending' };
    }
    const request = reqResult.rows[0];

    // Verify reviewer is the manager
    const employeeResult = await client.query('SELECT * FROM users WHERE id = $1', [request.user_id]);
    const employee = employeeResult.rows[0];
    
    if (employee.manager_id !== reviewerId) {
      // Check if reviewer is admin
      const reviewerResult = await client.query('SELECT role FROM users WHERE id = $1', [reviewerId]);
      if (reviewerResult.rows[0]?.role !== 'admin') {
        throw { status: 403, message: 'Not authorized to approve this request' };
      }
    }

    // Deduct from balance
    const leaveType = await client.query('SELECT * FROM leave_types WHERE id = $1', [request.leave_type_id]);
    if (['annual', 'sick'].includes(leaveType.rows[0].category)) {
      const updateResult = await client.query(
        `UPDATE leave_balances 
         SET used_days = used_days + $1, remaining = remaining - $1, updated_at = NOW()
         WHERE user_id = $2 AND leave_type_id = $3 AND year = EXTRACT(YEAR FROM $4::date) AND remaining >= $1
         RETURNING *`,
        [request.requested_days, request.user_id, request.leave_type_id, request.start_date]
      );
      if (updateResult.rows.length === 0) {
        throw { status: 409, message: 'Insufficient leave balance' };
      }
    }

    // Update request status
    await client.query(
      `UPDATE leave_requests SET status = 'approved', reviewer_id = $1, reviewer_comment = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [reviewerId, comment, requestId]
    );

    await client.query('COMMIT');

    // Notify employee
    notificationService.notifyLeaveDecision(request, employee, 'approved', comment).catch(console.error);

    return { ...request, status: 'approved' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectLeaveRequest(requestId, reviewerId, comment) {
  const request = await db.query(
    `UPDATE leave_requests SET status = 'rejected', reviewer_id = $1, reviewer_comment = $2, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $3 AND status = 'pending' RETURNING *`,
    [reviewerId, comment, requestId]
  );
  
  if (request.rows.length === 0) {
    throw { status: 404, message: 'Request not found or not pending' };
  }

  // Notify employee
  const employee = await db.query('SELECT * FROM users WHERE id = $1', [request.rows[0].user_id]);
  if (employee.rows[0]) {
    notificationService.notifyLeaveDecision(request.rows[0], employee.rows[0], 'rejected', comment).catch(console.error);
  }

  return request.rows[0];
}

async function cancelLeaveRequest(requestId, userId) {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    const request = await client.query(
      'SELECT * FROM leave_requests WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [requestId, userId]
    );
    
    if (request.rows.length === 0) {
      throw { status: 404, message: 'Request not found' };
    }
    
    const req = request.rows[0];
    if (!['pending', 'approved'].includes(req.status)) {
      throw { status: 400, message: 'Cannot cancel this request' };
    }

    // If approved, restore balance
    if (req.status === 'approved') {
      const leaveType = await client.query('SELECT * FROM leave_types WHERE id = $1', [req.leave_type_id]);
      if (['annual', 'sick'].includes(leaveType.rows[0].category)) {
        await client.query(
          `UPDATE leave_balances 
           SET used_days = used_days - $1, remaining = remaining + $1
           WHERE user_id = $2 AND leave_type_id = $3 AND year = EXTRACT(YEAR FROM $4::date)`,
          [req.requested_days, userId, req.leave_type_id, req.start_date]
        );
      }
    }

    await client.query(
      `UPDATE leave_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [requestId]
    );

    await client.query('COMMIT');
    return { ...req, status: 'cancelled' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getTeamConflicts(userId, startDate, endDate) {
  const result = await db.query(
    `SELECT lr.*, u.name as employee_name
     FROM leave_requests lr
     JOIN users u ON u.id = lr.user_id
     WHERE lr.status IN ('pending', 'approved')
     AND lr.start_date <= $3 AND lr.end_date >= $2
     AND u.manager_id = (SELECT manager_id FROM users WHERE id = $1)
     AND lr.user_id != $1`,
    [userId, startDate, endDate]
  );
  return result.rows;
}

module.exports = {
  submitLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getTeamConflicts,
};
