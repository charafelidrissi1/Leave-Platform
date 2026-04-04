import { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import api from '../api/client';

export default function MyLeavesPage() {
  const { t, tField } = useI18n();
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  async function fetchLeaves() {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await api.get('/api/leaves/my', { params });
      setLeaves(data);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function cancelRequest(id) {
    if (!confirm(t('leave.cancel_confirm'))) return;
    try {
      await api.delete(`/api/leaves/${id}`);
      fetchLeaves();
    } catch {}
  }

  const statuses = ['', 'pending', 'approved', 'rejected', 'cancelled'];

  return (
    <div className="fade-in">
      <div className="header">
        <div className="header-left">
          <h2>{t('my_leaves.title')}</h2>
          <p>{t('my_leaves.subtitle')}</p>
        </div>
      </div>

      <div className="filter-bar">
        {statuses.map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s ? t(`my_leaves.${s}`) : t('my_leaves.all')}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : leaves.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>{t('my_leaves.no_leaves')}</p>
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
                <th>{t('my_leaves.submitted')}</th>
                <th>{t('my_leaves.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id}>
                  <td>{tField(leave, 'name')}</td>
                  <td>{leave.start_date?.split('T')[0]} → {leave.end_date?.split('T')[0]}</td>
                  <td>{parseFloat(leave.requested_days)}</td>
                  <td><span className={`status-badge ${leave.status}`}><span className="status-dot" />{t(`my_leaves.${leave.status}`)}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(leave.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      {['pending', 'approved'].includes(leave.status) && (
                        <button className="btn btn-sm btn-danger" onClick={() => cancelRequest(leave.id)}>
                          {t('leave.cancel')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
