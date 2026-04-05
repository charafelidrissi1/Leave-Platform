const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/env');

async function register(req, res) {
  try {
    const { name, email, password, role, joiningDate, birthDate, managerId, preferredLanguage, phone, address, department } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, joining_date, birth_date, manager_id, preferred_language, phone, address, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, name, email, role, joining_date, preferred_language`,
      [name, email, passwordHash, role || 'employee', joiningDate || new Date(), birthDate, managerId, preferredLanguage || 'fr', phone, address, department]
    );

    // Create initial leave balances
    const currentYear = new Date().getFullYear();
    const leaveTypes = await db.query('SELECT * FROM leave_types WHERE is_active = true AND category IN ($1, $2)', ['annual', 'sick']);
    const { calculateAnnualLeaveEntitlement } = require('../utils/workingDays');
    
    for (const lt of leaveTypes.rows) {
      let totalAllowed = parseFloat(lt.default_days_per_year) || 0;
      if (lt.category === 'annual') {
        totalAllowed = calculateAnnualLeaveEntitlement(joiningDate || new Date(), currentYear);
      }
      await db.query(
        `INSERT INTO leave_balances (user_id, leave_type_id, year, total_allowed, used_days, remaining, carried_over)
         VALUES ($1, $2, $3, $4, 0, $4, 0) ON CONFLICT DO NOTHING`,
        [result.rows[0].id, lt.id, currentYear, totalAllowed]
      );
    }

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const refreshToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferred_language,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const u = user.rows[0];
    const payload = { id: u.id, email: u.email, role: u.role, name: u.name };
    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

async function getProfile(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, joining_date, birth_date, manager_id, preferred_language, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { register, login, refreshToken, getProfile };
