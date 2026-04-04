import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

export default function Header() {
  const { locale, setLocale, t, tField } = useI18n();
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.patch('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  }

  async function markRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('notifications.just_now');
    if (mins < 60) return t('notifications.minutes_ago').replace('{{count}}', mins);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('notifications.hours_ago').replace('{{count}}', hours);
    const days = Math.floor(hours / 24);
    return t('notifications.days_ago').replace('{{count}}', days);
  }

  return (
    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', marginBottom:'24px' }}>
      {/* Language Switcher */}
      <div className="lang-switcher">
        <button className={`lang-btn ${locale === 'en' ? 'active' : ''}`} onClick={() => setLocale('en')}>EN</button>
        <button className={`lang-btn ${locale === 'fr' ? 'active' : ''}`} onClick={() => setLocale('fr')}>FR</button>
        <button className={`lang-btn ${locale === 'ar' ? 'active' : ''}`} onClick={() => setLocale('ar')}>عر</button>
      </div>

      {/* Notification Bell */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button className="notification-bell" onClick={() => setNotifOpen(!notifOpen)} id="notification-bell">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>

        {notifOpen && (
          <div className="notification-dropdown">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '14px' }}>{t('notifications.title')}</strong>
              {unreadCount > 0 && (
                <button className="btn btn-sm btn-ghost" onClick={markAllRead}>{t('notifications.mark_all_read')}</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>{t('notifications.no_notifications')}</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                  {!n.is_read && <div className="notif-dot" />}
                  <div className="notif-content">
                    <div className="notif-title">{tField(n, 'title')}</div>
                    <div className="notif-message">{tField(n, 'message')}</div>
                    <div className="notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
