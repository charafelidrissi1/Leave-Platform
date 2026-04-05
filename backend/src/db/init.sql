-- ============================================================
-- Leave Management Platform - Database Schema
-- Compliant with Moroccan Code du Travail (Loi n° 65-99)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    birth_date DATE,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    preferred_language VARCHAR(5) DEFAULT 'fr' CHECK (preferred_language IN ('en', 'fr', 'ar')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- LEAVE TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('annual', 'sick', 'maternity', 'special', 'unpaid')),
    default_days_per_year NUMERIC(4,1) DEFAULT 0,
    requires_document BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- LEAVE BALANCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_allowed NUMERIC(5,1) NOT NULL DEFAULT 0,
    used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
    remaining NUMERIC(5,1) NOT NULL DEFAULT 0,
    carried_over NUMERIC(5,1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, leave_type_id, year),
    CHECK (remaining >= 0),
    CHECK (used_days >= 0)
);

-- ============================================================
-- LEAVE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    requested_days NUMERIC(5,1) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    reviewer_comment TEXT,
    document_url VARCHAR(500),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

-- ============================================================
-- PUBLIC HOLIDAYS TABLE (Moroccan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public_holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_fr VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    is_fixed BOOLEAN DEFAULT true,
    year INTEGER NOT NULL,
    UNIQUE(holiday_date)
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_en VARCHAR(255),
    title_fr VARCHAR(255),
    title_ar VARCHAR(255),
    message_en TEXT,
    message_fr TEXT,
    message_ar TEXT,
    is_read BOOLEAN DEFAULT false,
    related_request_id INTEGER REFERENCES leave_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_year ON leave_balances(user_id, year);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_public_holidays_year ON public_holidays(year);
CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public_holidays(holiday_date);

-- ============================================================
-- SEED DATA: Leave Types (Moroccan Labor Law)
-- ============================================================
INSERT INTO leave_types (name_en, name_fr, name_ar, category, default_days_per_year, requires_document) VALUES
    ('Annual Leave',          'Congé Annuel',           'إجازة سنوية',          'annual',    18,   false),
    ('Sick Leave',            'Congé Maladie',          'إجازة مرضية',          'sick',      0,    true),
    ('Maternity Leave',       'Congé Maternité',        'إجازة أمومة',          'maternity', 98,   true),
    ('Marriage (Self)',       'Mariage (Soi-même)',     'زواج (الموظف)',         'special',   4,    true),
    ('Marriage (Child)',      'Mariage (Enfant)',       'زواج (الابن)',          'special',   2,    true),
    ('Death (Spouse/Child/Parent)', 'Décès (Conjoint/Enfant/Parent)', 'وفاة (الزوج/الابن/الوالد)', 'special', 3, true),
    ('Death (Sibling)',       'Décès (Frère/Sœur)',     'وفاة (الأخ/الأخت)',     'special',   2,    true),
    ('Circumcision',          'Circoncision',           'ختان',                  'special',   2,    true),
    ('Surgery (Dependent)',   'Opération (À charge)',   'عملية جراحية (معال)',    'special',   2,    true),
    ('Unpaid Leave',          'Congé Sans Solde',       'إجازة بدون راتب',       'unpaid',    0,    false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Moroccan Fixed Public Holidays 2026
-- ============================================================
INSERT INTO public_holidays (holiday_date, name_en, name_fr, name_ar, is_fixed, year) VALUES
    ('2026-01-01', 'New Year''s Day',                    'Nouvel An',                          'رأس السنة الميلادية',        true,  2026),
    ('2026-01-11', 'Independence Manifesto',             'Manifeste de l''Indépendance',       'ذكرى تقديم وثيقة الاستقلال',  true,  2026),
    ('2026-01-14', 'Amazigh New Year',                   'Nouvel An Amazigh (Yennayer)',        'رأس السنة الأمازيغية',       true,  2026),
    ('2026-05-01', 'Labour Day',                         'Fête du Travail',                    'عيد الشغل',                  true,  2026),
    ('2026-07-30', 'Throne Day',                         'Fête du Trône',                      'عيد العرش',                  true,  2026),
    ('2026-08-14', 'Oued Ed-Dahab Day',                  'Journée Oued Ed-Dahab',              'ذكرى استرجاع وادي الذهب',     true,  2026),
    ('2026-08-20', 'Revolution of the King and People',  'Révolution du Roi et du Peuple',     'ذكرى ثورة الملك والشعب',     true,  2026),
    ('2026-08-21', 'Youth Day',                          'Fête de la Jeunesse',                'عيد الشباب',                 true,  2026),
    ('2026-10-31', 'Unity Day',                          'Aïd Al Wahda',                       'عيد الوحدة',                 true,  2026),
    ('2026-11-06', 'Green March',                        'Anniversaire de la Marche Verte',    'ذكرى المسيرة الخضراء',       true,  2026),
    ('2026-11-18', 'Independence Day',                   'Fête de l''Indépendance',            'عيد الاستقلال',              true,  2026),
    -- Islamic holidays (estimated for 2026 — admin should verify)
    ('2026-03-20', 'Eid Al-Fitr (Day 1)',                'Aïd Al-Fitr (Jour 1)',               'عيد الفطر (اليوم 1)',        false, 2026),
    ('2026-03-21', 'Eid Al-Fitr (Day 2)',                'Aïd Al-Fitr (Jour 2)',               'عيد الفطر (اليوم 2)',        false, 2026),
    ('2026-05-27', 'Eid Al-Adha (Day 1)',                'Aïd Al-Adha (Jour 1)',               'عيد الأضحى (اليوم 1)',       false, 2026),
    ('2026-05-28', 'Eid Al-Adha (Day 2)',                'Aïd Al-Adha (Jour 2)',               'عيد الأضحى (اليوم 2)',       false, 2026),
    ('2026-06-17', 'Islamic New Year',                   '1er Moharram',                       'فاتح محرم',                  false, 2026),
    ('2026-08-26', 'Prophet''s Birthday (Day 1)',        'Aïd Al-Mawlid (Jour 1)',             'عيد المولد النبوي (اليوم 1)', false, 2026),
    ('2026-08-27', 'Prophet''s Birthday (Day 2)',        'Aïd Al-Mawlid (Jour 2)',             'عيد المولد النبوي (اليوم 2)', false, 2026)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Demo Users
-- Password for all: "password123" (bcrypt hash)
-- ============================================================
INSERT INTO users (name, email, password_hash, role, joining_date, birth_date, preferred_language) VALUES
    ('Admin User',      'admin@giggty.com',    '$2a$10$mvr5o8QNC/.xDchtGsbwFeKG137WJ.jKvQMW3PxP5vFPGXbUe7gX6', 'admin',    '2020-01-15', '1985-03-20', 'fr'),
    ('Manager Ahmed',   'ahmed@giggty.com',    '$2a$10$mvr5o8QNC/.xDchtGsbwFeKG137WJ.jKvQMW3PxP5vFPGXbUe7gX6', 'manager',  '2018-06-01', '1980-07-15', 'fr'),
    ('Fatima Zahra',    'fatima@giggty.com',   '$2a$10$mvr5o8QNC/.xDchtGsbwFeKG137WJ.jKvQMW3PxP5vFPGXbUe7gX6', 'employee', '2022-03-10', '1995-11-08', 'ar'),
    ('Youssef El Amrani','youssef@giggty.com', '$2a$10$mvr5o8QNC/.xDchtGsbwFeKG137WJ.jKvQMW3PxP5vFPGXbUe7gX6', 'employee', '2023-09-01', '1998-04-25', 'en'),
    ('Khadija Bennani', 'khadija@giggty.com',  '$2a$10$mvr5o8QNC/.xDchtGsbwFeKG137WJ.jKvQMW3PxP5vFPGXbUe7gX6', 'employee', '2021-01-20', '1992-12-03', 'fr')
ON CONFLICT DO NOTHING;

-- Assign manager to employees
UPDATE users SET manager_id = 2 WHERE role = 'employee';

-- ============================================================
-- SEED DATA: Leave Balances for 2026
-- ============================================================
INSERT INTO leave_balances (user_id, leave_type_id, year, total_allowed, used_days, remaining, carried_over)
SELECT 
    u.id,
    lt.id,
    2026,
    CASE 
        WHEN lt.category = 'annual' THEN 
            LEAST(18 + FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.joining_date)) / 5) * 1.5, 30)
        WHEN lt.category = 'sick' THEN 30
        WHEN lt.category = 'maternity' THEN 98
        ELSE lt.default_days_per_year
    END,
    0,
    CASE 
        WHEN lt.category = 'annual' THEN 
            LEAST(18 + FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.joining_date)) / 5) * 1.5, 30)
        WHEN lt.category = 'sick' THEN 30
        WHEN lt.category = 'maternity' THEN 98
        ELSE lt.default_days_per_year
    END,
    0
FROM users u
CROSS JOIN leave_types lt
WHERE u.role != 'admin' AND lt.is_active = true AND lt.category IN ('annual', 'sick')
ON CONFLICT DO NOTHING;
