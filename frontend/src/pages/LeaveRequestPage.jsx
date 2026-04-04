import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n';
import api from '../api/client';

export default function LeaveRequestPage() {
  const { t, tField } = useI18n();
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [preview, setPreview] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/leaves/types').then(res => setLeaveTypes(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.startDate && form.endDate) {
      api.get('/api/leaves/preview', { params: { startDate: form.startDate, endDate: form.endDate } })
        .then(res => {
          setPreview(res.data.workingDays);
          setConflicts(res.data.conflicts || []);
        })
        .catch(() => setPreview(null));
    } else {
      setPreview(null);
      setConflicts([]);
    }
  }, [form.startDate, form.endDate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/api/leaves', form);
      setSuccess(t('leave.success'));
      setTimeout(() => navigate('/my-leaves'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="header">
        <div className="header-left">
          <h2>{t('leave.request_title')}</h2>
          <p>{t('leave.request_subtitle')}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        {error && <div className="login-error" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && (
          <div style={{ background: 'var(--success-subtle)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('leave.type')}</label>
            <select
              className="form-select"
              value={form.leaveTypeId}
              onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}
              required
              id="leave-type-select"
            >
              <option value="">{t('leave.select_type')}</option>
              {leaveTypes.map(lt => (
                <option key={lt.id} value={lt.id}>{tField(lt, 'name')}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('leave.start_date')}</label>
              <input
                className="form-input"
                type="date"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                required
                id="start-date-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('leave.end_date')}</label>
              <input
                className="form-input"
                type="date"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                min={form.startDate}
                required
                id="end-date-input"
              />
            </div>
          </div>

          {preview !== null && (
            <div className="day-preview">
              <div className="day-preview-number">{preview}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{t('leave.working_days')}</div>
                <div className="day-preview-label">{t('leave.working_days_note')}</div>
              </div>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="conflict-warning">
              ⚠️ {t('leave.conflicts')}
              <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                {conflicts.map((c, i) => (
                  <li key={i}>{c.employee_name} ({c.start_date?.split('T')[0]} → {c.end_date?.split('T')[0]})</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('leave.reason')}</label>
            <textarea
              className="form-textarea"
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder={t('leave.reason_placeholder')}
              id="leave-reason"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              {t('leave.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting} id="submit-leave-btn">
              {submitting ? t('leave.submitting') : t('leave.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
