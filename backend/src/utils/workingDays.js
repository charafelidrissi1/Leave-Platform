const db = require('../config/database');

/**
 * Calculate working days between two dates (Morocco-specific).
 * Excludes: Sundays + all Moroccan public holidays.
 * Work week: Monday to Saturday (6 days).
 */
async function calculateWorkingDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) return 0;

  // Fetch holidays in the date range
  const holidayResult = await db.query(
    `SELECT holiday_date FROM public_holidays 
     WHERE holiday_date >= $1 AND holiday_date <= $2`,
    [startDate, endDate]
  );
  
  const holidays = new Set(
    holidayResult.rows.map(r => r.holiday_date.toISOString().split('T')[0])
  );

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0=Sunday
    const dateStr = current.toISOString().split('T')[0];

    // Exclude Sundays (0) and public holidays
    if (dayOfWeek !== 0 && !holidays.has(dateStr)) {
      workingDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

/**
 * Calculate seniority-based annual leave entitlement (Code du Travail Art. 231+).
 * Base: 18 days, +1.5 days per 5 years of service, max 30.
 */
function calculateAnnualLeaveEntitlement(joiningDate, currentYear) {
  const joining = new Date(joiningDate);
  const yearsOfService = currentYear - joining.getFullYear();
  const seniorityBonusPeriods = Math.floor(Math.max(yearsOfService, 0) / 5);
  const seniorityBonus = seniorityBonusPeriods * 1.5;
  return Math.min(18 + seniorityBonus, 30);
}

module.exports = { calculateWorkingDays, calculateAnnualLeaveEntitlement };
