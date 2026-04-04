const db = require('../config/database');
const { sendEmail, leaveRequestEmail } = require('../config/email');

async function createNotification({ userId, titleEn, titleFr, titleAr, messageEn, messageFr, messageAr, relatedRequestId }) {
  const result = await db.query(
    `INSERT INTO notifications (user_id, title_en, title_fr, title_ar, message_en, message_fr, message_ar, related_request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, titleEn, titleFr, titleAr, messageEn, messageFr, messageAr, relatedRequestId]
  );
  return result.rows[0];
}

async function notifyLeaveSubmitted(request, employee, manager) {
  const dates = `${request.start_date} → ${request.end_date}`;
  
  // In-app notification for manager
  await createNotification({
    userId: manager.id,
    titleEn: 'New Leave Request',
    titleFr: 'Nouvelle demande de congé',
    titleAr: 'طلب إجازة جديد',
    messageEn: `${employee.name} submitted a leave request for ${dates}`,
    messageFr: `${employee.name} a soumis une demande de congé pour ${dates}`,
    messageAr: `${employee.name} قدم طلب إجازة للفترة ${dates}`,
    relatedRequestId: request.id,
  });

  // Email notification
  const emailGen = leaveRequestEmail(employee.name, dates, 'submitted', manager.preferred_language || 'fr');
  const emailContent = emailGen('submitted');
  await sendEmail({ to: manager.email, ...emailContent });
}

async function notifyLeaveDecision(request, employee, status, reviewerComment) {
  const dates = `${request.start_date} → ${request.end_date}`;
  const statusKey = status === 'approved' ? 'approved' : 'rejected';

  // In-app notification for employee
  await createNotification({
    userId: employee.id,
    titleEn: `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    titleFr: `Congé ${status === 'approved' ? 'approuvé' : 'refusé'}`,
    titleAr: `${status === 'approved' ? 'تمت الموافقة على الإجازة' : 'تم رفض الإجازة'}`,
    messageEn: `Your leave request for ${dates} has been ${status}.${reviewerComment ? ' Comment: ' + reviewerComment : ''}`,
    messageFr: `Votre demande de congé pour ${dates} a été ${status === 'approved' ? 'approuvée' : 'refusée'}.${reviewerComment ? ' Commentaire: ' + reviewerComment : ''}`,
    messageAr: `طلب الإجازة الخاص بك للفترة ${dates} تم ${status === 'approved' ? 'الموافقة عليه' : 'رفضه'}.${reviewerComment ? ' تعليق: ' + reviewerComment : ''}`,
    relatedRequestId: request.id,
  });

  // Email notification
  const emailGen = leaveRequestEmail(employee.name, dates, statusKey, employee.preferred_language || 'fr');
  const emailContent = emailGen(statusKey);
  await sendEmail({ to: employee.email, ...emailContent });
}

async function getUserNotifications(userId, limit = 20, offset = 0) {
  const result = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

async function getUnreadCount(userId) {
  const result = await db.query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}

async function markAsRead(notificationId, userId) {
  const result = await db.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}

async function markAllAsRead(userId) {
  await db.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
}

module.exports = {
  createNotification,
  notifyLeaveSubmitted,
  notifyLeaveDecision,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
