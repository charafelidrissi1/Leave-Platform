import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import api from '../api/client';

const BALANCE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

function ProgressRing({ used, total, color }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? Math.min((total - used) / total, 1) : 0;
  const offset = circumference * (1 - percent);

  return (
    <div className="progress-ring">
      <svg>
        <circle className="progress-ring-bg" cx="32" cy="32" r={radius} />
        <circle
          className="progress-ring-fill"
          cx="32" cy="32" r={radius}
          style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isManager, isAdmin } = useAuth();
  const { t, tField } = useI18n();
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [balRes, reqRes] = await Promise.all([
        api.get('/api/balances/my'),
        api.get('/api/leaves/my'),
      ]);
      setBalances(balRes.data);
      setRecentRequests(reqRes.data.slice(0, 5));

      if (isManager) {
        const pendRes = await api.get('/api/leaves/pending');
        setPendingCount(pendRes.data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="header">
        <div className="header-left">
          <h2>{t('dashboard.title')}</h2>
          <p>{t('dashboard.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/request')} id="quick-request-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('nav.request_leave')}
        </button>
      </div>

      {/* Stats for managers */}
      {isManager && (
        <div className="stats-grid stagger">
          <div className="stat-card">
            <div className="stat-card-label">{t('dashboard.pending_approvals')}</div>
            <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 600 }}>{t('dashboard.balance_title')}</h3>
      <div className="balance-grid stagger">
        {balances.filter(b => parseFloat(b.total_allowed) > 0).map((b, i) => (
          <div className="balance-card" key={b.id} style={{ '--card-accent': BALANCE_COLORS[i % BALANCE_COLORS.length] }}>
            <div className="balance-card-type">{tField(b, 'name')}</div>
            <div className="balance-card-ring">
              <ProgressRing used={parseFloat(b.used_days)} total={parseFloat(b.total_allowed)} color={BALANCE_COLORS[i % BALANCE_COLORS.length]} />
              <div className="balance-card-numbers">
                <div className="balance-remaining">{parseFloat(b.remaining)}</div>
                <div className="balance-total">
                  {t('dashboard.remaining')} · {parseFloat(b.used_days)} {t('dashboard.days_used')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <h3 style={{ marginBottom: '16px', marginTop: '32px', fontSize: '1.1rem', fontWeight: 600 }}>{t('dashboard.recent_requests')}</h3>
      {recentRequests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>{t('dashboard.no_requests')}</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('my_leaves.type_col')}</th>
                <th>{t('my_leaves.dates')}</th>
                <th>{t('my_leaves.days_col')}</th>
                <th>{t('my_leaves.status')}</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map(req => (
                <tr key={req.id}>
                  <td>{tField(req, 'name')}</td>
                  <td>{req.start_date?.split('T')[0]} → {req.end_date?.split('T')[0]}</td>
                  <td>{parseFloat(req.requested_days)}</td>
                  <td><span className={`status-badge ${req.status}`}><span className="status-dot" />{t(`my_leaves.${req.status}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
