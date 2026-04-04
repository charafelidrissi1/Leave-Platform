const db = require('../config/database');
const { calculateAnnualLeaveEntitlement } = require('../utils/workingDays');

async function recalculateBalances(year) {
  // Get all active non-admin users
  const users = await db.query(
    `SELECT id, joining_date, birth_date FROM users WHERE role != 'admin' AND is_active = true`
  );

  const leaveTypes = await db.query(
    `SELECT * FROM leave_types WHERE is_active = true`
  );

  for (const user of users.rows) {
    for (const lt of leaveTypes.rows) {
      let totalAllowed = parseFloat(lt.default_days_per_year) || 0;

      if (lt.category === 'annual') {
        totalAllowed = calculateAnnualLeaveEntitlement(user.joining_date, year);
      }

      // Check for carry-over from previous year
      const prevBalance = await db.query(
        `SELECT remaining FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
        [user.id, lt.id, year - 1]
      );
      const carriedOver = prevBalance.rows.length > 0 ? Math.min(parseFloat(prevBalance.rows[0].remaining), totalAllowed) : 0;

      // Upsert balance
      await db.query(
        `INSERT INTO leave_balances (user_id, leave_type_id, year, total_allowed, used_days, remaining, carried_over)
         VALUES ($1, $2, $3, $4, 0, $4 + $5, $5)
         ON CONFLICT (user_id, leave_type_id, year) 
         DO UPDATE SET total_allowed = $4, remaining = $4 + $5 - leave_balances.used_days, carried_over = $5`,
        [user.id, lt.id, year, totalAllowed, carriedOver]
      );
    }
  }

  return { message: `Balances recalculated for year ${year}` };
}

async function getUserBalances(userId, year) {
  const result = await db.query(
    `SELECT lb.*, lt.name_en, lt.name_fr, lt.name_ar, lt.category
     FROM leave_balances lb
     JOIN leave_types lt ON lt.id = lb.leave_type_id
     WHERE lb.user_id = $1 AND lb.year = $2
     ORDER BY lt.id`,
    [userId, year]
  );
  return result.rows;
}

async function adjustBalance(userId, leaveTypeId, year, adjustment) {
  const result = await db.query(
    `UPDATE leave_balances 
     SET total_allowed = total_allowed + $1, remaining = remaining + $1
     WHERE user_id = $2 AND leave_type_id = $3 AND year = $4
     RETURNING *`,
    [adjustment, userId, leaveTypeId, year]
  );
  return result.rows[0];
}

module.exports = { recalculateBalances, getUserBalances, adjustBalance };
