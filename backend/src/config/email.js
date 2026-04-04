const nodemailer = require('nodemailer');
const config = require('./env');

let transporter = null;

function getTransporter() {
  if (!transporter && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Email not configured — skipping email to:', to);
    return null;
  }
  try {
    const info = await transport.sendMail({
      from: `"Leave Platform" <${config.smtp.from}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
    return null;
  }
}

function leaveRequestEmail(employeeName, dates, status, lang = 'fr') {
  const templates = {
    en: {
      submitted: { subject: `Leave Request Submitted`, body: `<p>A new leave request has been submitted by <strong>${employeeName}</strong> for <strong>${dates}</strong>.</p><p>Please review it on the <a href="${config.frontendUrl}">Leave Platform</a>.</p>` },
      approved: { subject: `Leave Request Approved`, body: `<p>Your leave request for <strong>${dates}</strong> has been <span style="color:#10b981;font-weight:bold">approved</span>.</p>` },
      rejected: { subject: `Leave Request Rejected`, body: `<p>Your leave request for <strong>${dates}</strong> has been <span style="color:#ef4444;font-weight:bold">rejected</span>.</p>` },
    },
    fr: {
      submitted: { subject: `Demande de congé soumise`, body: `<p>Une nouvelle demande de congé a été soumise par <strong>${employeeName}</strong> pour <strong>${dates}</strong>.</p><p>Veuillez la consulter sur la <a href="${config.frontendUrl}">Plateforme de congés</a>.</p>` },
      approved: { subject: `Demande de congé approuvée`, body: `<p>Votre demande de congé pour <strong>${dates}</strong> a été <span style="color:#10b981;font-weight:bold">approuvée</span>.</p>` },
      rejected: { subject: `Demande de congé refusée`, body: `<p>Votre demande de congé pour <strong>${dates}</strong> a été <span style="color:#ef4444;font-weight:bold">refusée</span>.</p>` },
    },
    ar: {
      submitted: { subject: `تم تقديم طلب إجازة`, body: `<p dir="rtl">تم تقديم طلب إجازة جديد من طرف <strong>${employeeName}</strong> للفترة <strong>${dates}</strong>.</p><p dir="rtl">يرجى مراجعته على <a href="${config.frontendUrl}">منصة الإجازات</a>.</p>` },
      approved: { subject: `تمت الموافقة على طلب الإجازة`, body: `<p dir="rtl">تمت <span style="color:#10b981;font-weight:bold">الموافقة</span> على طلب الإجازة الخاص بك للفترة <strong>${dates}</strong>.</p>` },
      rejected: { subject: `تم رفض طلب الإجازة`, body: `<p dir="rtl">تم <span style="color:#ef4444;font-weight:bold">رفض</span> طلب الإجازة الخاص بك للفترة <strong>${dates}</strong>.</p>` },
    },
  };

  const t = templates[lang] || templates.fr;
  return (statusKey) => {
    const tpl = t[statusKey];
    return {
      subject: tpl.subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;padding:20px;background:#f8fafc;">${tpl.body}</body></html>`,
    };
  };
}

module.exports = { sendEmail, leaveRequestEmail };
