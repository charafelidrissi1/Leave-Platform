const db = require('../config/database');

async function getAllUsers(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.joining_date, u.birth_date, u.manager_id, u.is_active, u.preferred_language,
              u.phone, u.address, u.department,
              m.name as manager_name
       FROM users u
       LEFT JOIN users m ON m.id = u.manager_id
       ORDER BY u.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getUserById(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.joining_date, u.birth_date, u.manager_id, u.is_active, u.preferred_language,
              u.phone, u.address, u.department,
              m.name as manager_name
       FROM users u
       LEFT JOIN users m ON m.id = u.manager_id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateUser(req, res) {
  try {
    const { name, email, role, managerId, isActive, preferredLanguage, phone, address, department } = req.body;
    const result = await db.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        manager_id = $4,
        is_active = COALESCE($5, is_active),
        preferred_language = COALESCE($6, preferred_language),
        phone = COALESCE($7, phone),
        address = COALESCE($8, address),
        department = COALESCE($9, department),
        updated_at = NOW()
       WHERE id = $10 RETURNING id, name, email, role, joining_date, manager_id, is_active, preferred_language, phone, address, department`,
      [name, email, role, managerId, isActive, preferredLanguage, phone, address, department, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getTeam(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, joining_date, is_active FROM users 
       WHERE manager_id = $1 AND is_active = true ORDER BY name`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getManagers(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, email FROM users WHERE role IN ('manager', 'admin') AND is_active = true ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAllUsers, getUserById, updateUser, getTeam, getManagers };
