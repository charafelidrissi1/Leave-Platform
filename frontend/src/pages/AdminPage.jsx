import { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import api from '../api/client';

export default function AdminPage() {
  const { t, tField } = useI18n();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee', joiningDate: '', managerId: '', phone: '', address: '', department: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [newHoliday, setNewHoliday] = useState({ holidayDate: '', nameEn: '', nameFr: '', nameAr: '', isFixed: false, year: new Date().getFullYear() });
  const [managers, setManagers] = useState([]);

  useEffect(() => { fetchData(); }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const [usersRes, managersRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/users/managers'),
        ]);
        setUsers(usersRes.data);
        setManagers(managersRes.data);
      } else {
        const { data } = await api.get('/api/holidays', { params: { year: new Date().getFullYear() } });
        setHolidays(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function addUser(e) {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'employee', joiningDate: '', managerId: '', phone: '', address: '', department: '' });
      fetchData();
    } catch {}
  }

  async function editUser(user) {
    setEditingUser({
      ...user,
      joiningDate: user.joining_date?.split('T')[0] || ''
    });
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    try {
      const { id, name, email, role, manager_id, is_active, preferred_language, phone, address, department } = editingUser;
      await api.put(`/api/users/${id}`, {
        name,
        email,
        role,
        managerId: manager_id,
        isActive: is_active,
        preferredLanguage: preferred_language,
        phone,
        address,
        department
      });
      setEditingUser(null);
      fetchData();
    } catch {}
  }

  async function addHoliday(e) {
    e.preventDefault();
    try {
      await api.post('/api/holidays', newHoliday);
      setShowAddHoliday(false);
      setNewHoliday({ holidayDate: '', nameEn: '', nameFr: '', nameAr: '', isFixed: false, year: new Date().getFullYear() });
      fetchData();
    } catch {}
  }

  async function deleteHoliday(id) {
    try {
      await api.delete(`/api/holidays/${id}`);
      fetchData();
    } catch {}
  }

  async function seedHolidays() {
    try {
      await api.post('/api/holidays/seed', { year: new Date().getFullYear() });
      fetchData();
    } catch {}
  }

  async function recalculateBalances() {
    try {
      await api.post('/api/balances/recalculate', { year: new Date().getFullYear() });
      alert(t('common.success'));
    } catch {}
  }

  return (
    <div className="fade-in">
      <div className="header">
        <div className="header-left">
          <h2>{t('admin.title')}</h2>
          <p>{t('admin.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={recalculateBalances}>{t('admin.recalculate')}</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          {t('admin.users_tab')}
        </button>
        <button className={`tab-btn ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => setActiveTab('holidays')}>
          {t('admin.holidays_tab')}
        </button>
      </div>

      {loading ? <div className="spinner" /> : activeTab === 'users' ? (
        <>
          <div style={{ marginBottom: '16px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(true)} id="add-user-btn">
              + {t('admin.add_user')}
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                    <th>{t('admin.name')}</th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.role')}</th>
                  <th>{t('admin.department')}</th>
                  <th>{t('admin.manager')}</th>
                  <th>{t('admin.status')}</th>
                  <th>{t('my_leaves.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><span className={`status-badge ${u.role === 'admin' ? 'approved' : u.role === 'manager' ? 'pending' : ''}`} style={u.role === 'employee' ? { background: 'var(--info-subtle)', color: 'var(--info)' } : {}}>{u.role}</span></td>
                    <td>{u.department || '—'}</td>
                    <td>{u.manager_name || '—'}</td>
                    <td>{u.is_active ? <span style={{ color: 'var(--success)' }}>●</span> : <span style={{ color: 'var(--text-muted)' }}>●</span>} {u.is_active ? t('admin.active') : t('admin.inactive')}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => editUser(u)}>{t('common.edit')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddHoliday(true)} id="add-holiday-btn">
              + {t('admin.add_holiday')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={seedHolidays}>{t('admin.seed_holidays')}</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.date')}</th>
                  <th>{t('admin.holiday_name')}</th>
                  <th>{t('admin.fixed')}/{t('admin.islamic')}</th>
                  <th>{t('my_leaves.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(h => (
                  <tr key={h.id}>
                    <td>{h.holiday_date?.split('T')[0]}</td>
                    <td>{tField(h, 'name')}</td>
                    <td><span className={`status-badge ${h.is_fixed ? 'approved' : 'pending'}`}>{h.is_fixed ? t('admin.fixed') : t('admin.islamic')}</span></td>
                    <td>
                      {!h.is_fixed && (
                        <button className="btn btn-sm btn-danger" onClick={() => deleteHoliday(h.id)}>{t('common.delete')}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.add_user')}</h3>
              <button className="modal-close" onClick={() => setShowAddUser(false)}>✕</button>
            </div>
            <form onSubmit={addUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('admin.name')}</label>
                  <input className="form-input" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.email')}</label>
                  <input className="form-input" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('login.password')}</label>
                  <input className="form-input" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('admin.role')}</label>
                    <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.manager')}</label>
                    <select className="form-select" value={newUser.managerId} onChange={e => setNewUser({ ...newUser, managerId: e.target.value })}>
                      <option value="">—</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.joining_date')}</label>
                  <input className="form-input" type="date" value={newUser.joiningDate} onChange={e => setNewUser({ ...newUser, joiningDate: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('admin.phone')}</label>
                    <input className="form-input" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.department')}</label>
                    <input className="form-input" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.address')}</label>
                  <textarea className="form-input" style={{ minHeight: '80px' }} value={newUser.address} onChange={e => setNewUser({ ...newUser, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddUser(false)}>{t('common.close')}</button>
                <button type="submit" className="btn btn-primary">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddHoliday && (
        <div className="modal-overlay" onClick={() => setShowAddHoliday(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.add_holiday')}</h3>
              <button className="modal-close" onClick={() => setShowAddHoliday(false)}>✕</button>
            </div>
            <form onSubmit={addHoliday}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('admin.date')}</label>
                  <input className="form-input" type="date" value={newHoliday.holidayDate} onChange={e => setNewHoliday({ ...newHoliday, holidayDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Name (EN)</label>
                  <input className="form-input" value={newHoliday.nameEn} onChange={e => setNewHoliday({ ...newHoliday, nameEn: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom (FR)</label>
                  <input className="form-input" value={newHoliday.nameFr} onChange={e => setNewHoliday({ ...newHoliday, nameFr: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">الاسم (AR)</label>
                  <input className="form-input" dir="rtl" value={newHoliday.nameAr} onChange={e => setNewHoliday({ ...newHoliday, nameAr: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddHoliday(false)}>{t('common.close')}</button>
                <button type="submit" className="btn btn-primary">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.edit_user')}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('admin.name')}</label>
                  <input className="form-input" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('admin.email')}</label>
                  <input className="form-input" type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} required />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('admin.role')}</label>
                    <select className="form-select" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.manager')}</label>
                    <select className="form-select" value={editingUser.manager_id || ''} onChange={e => setEditingUser({ ...editingUser, manager_id: e.target.value })}>
                      <option value="">—</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('admin.department')}</label>
                    <input className="form-input" value={editingUser.department || ''} onChange={e => setEditingUser({ ...editingUser, department: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.phone')}</label>
                    <input className="form-input" value={editingUser.phone || ''} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('admin.address')}</label>
                  <textarea className="form-input" style={{ minHeight: '80px' }} value={editingUser.address || ''} onChange={e => setEditingUser({ ...editingUser, address: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingUser.is_active} onChange={e => setEditingUser({ ...editingUser, is_active: e.target.checked })} />
                    {t('admin.active')}
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>{t('common.close')}</button>
                <button type="submit" className="btn btn-primary">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
