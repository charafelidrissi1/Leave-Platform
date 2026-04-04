import { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import api from '../api/client';

export default function ApprovalsPage() {
  const { t, tField } = useI18n();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { id, action: 'approve'|'reject' }
  const [comment, setComment] = useState('');

  useEffect(() => { fetchPending(); }, []);

  async function fetchPending() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/leaves/pending');
      setRequests(data);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleAction() {
    if (!actionModal) return;
    try {
      const endpoint = actionModal.action === 'approve' ? 'approve' : 'reject';
      await api.patch(`/api/leaves/${actionModal.id}/${endpoint}`, { comment });
      setActionModal(null);
      setComment('');
      fetchPending();
    } catch {}
  }

  return (
    <div className="fade-in">
      <div className="header">
        <div className="header-left">
          <h2>{t('approvals.title')}</h2>
          <p>{t('approvals.subtitle')}</p>
        </div>
      </div>

      {loading ? <div className="spinner" /> : requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p>{t('approvals.no_pending')}</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t('my_leaves.employee')}</th>
                <th>{t('my_leaves.type_col')}</th>
                <th>{t('my_leaves.dates')}</th>
                <th>{t('my_leaves.days_col')}</th>
                <th>{t('my_leaves.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{req.employee_name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{req.employee_email}</div>
                    </div>
                  </td>
                  <td>{tField(req, 'name')}</td>
                  <td>{req.start_date?.split('T')[0]} → {req.end_date?.split('T')[0]}</td>
                  <td>{parseFloat(req.requested_days)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-success" onClick={() => setActionModal({ id: req.id, action: 'approve' })}>
                        {t('approvals.approve')}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setActionModal({ id: req.id, action: 'reject' })}>
                        {t('approvals.reject')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionModal.action === 'approve' ? t('approvals.approve') : t('approvals.reject')}</h3>
              <button className="modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('approvals.comment')}</label>
                <textarea
                  className="form-textarea"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={t('approvals.comment_placeholder')}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setActionModal(null)}>{t('common.close')}</button>
              <button
                className={`btn ${actionModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleAction}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
