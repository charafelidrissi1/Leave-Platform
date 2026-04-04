const db = require('../config/database');

async function getHolidaysByYear(year) {
  const result = await db.query(
    `SELECT * FROM public_holidays WHERE year = $1 ORDER BY holiday_date`,
    [year]
  );
  return result.rows;
}

async function addHoliday({ holidayDate, nameEn, nameFr, nameAr, isFixed, year }) {
  const result = await db.query(
    `INSERT INTO public_holidays (holiday_date, name_en, name_fr, name_ar, is_fixed, year)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (holiday_date) DO UPDATE SET name_en = $2, name_fr = $3, name_ar = $4, is_fixed = $5
     RETURNING *`,
    [holidayDate, nameEn, nameFr, nameAr, isFixed, year]
  );
  return result.rows[0];
}

async function deleteHoliday(id) {
  const result = await db.query(
    'DELETE FROM public_holidays WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
}

async function seedFixedHolidays(year) {
  const fixedHolidays = [
    { date: `${year}-01-01`, en: "New Year's Day", fr: "Nouvel An", ar: "رأس السنة الميلادية" },
    { date: `${year}-01-11`, en: "Independence Manifesto", fr: "Manifeste de l'Indépendance", ar: "ذكرى تقديم وثيقة الاستقلال" },
    { date: `${year}-01-14`, en: "Amazigh New Year", fr: "Nouvel An Amazigh", ar: "رأس السنة الأمازيغية" },
    { date: `${year}-05-01`, en: "Labour Day", fr: "Fête du Travail", ar: "عيد الشغل" },
    { date: `${year}-07-30`, en: "Throne Day", fr: "Fête du Trône", ar: "عيد العرش" },
    { date: `${year}-08-14`, en: "Oued Ed-Dahab Day", fr: "Journée Oued Ed-Dahab", ar: "ذكرى استرجاع وادي الذهب" },
    { date: `${year}-08-20`, en: "Revolution of the King and People", fr: "Révolution du Roi et du Peuple", ar: "ذكرى ثورة الملك والشعب" },
    { date: `${year}-08-21`, en: "Youth Day", fr: "Fête de la Jeunesse", ar: "عيد الشباب" },
    { date: `${year}-10-31`, en: "Unity Day", fr: "Aïd Al Wahda", ar: "عيد الوحدة" },
    { date: `${year}-11-06`, en: "Green March", fr: "Marche Verte", ar: "ذكرى المسيرة الخضراء" },
    { date: `${year}-11-18`, en: "Independence Day", fr: "Fête de l'Indépendance", ar: "عيد الاستقلال" },
  ];

  for (const h of fixedHolidays) {
    await addHoliday({
      holidayDate: h.date,
      nameEn: h.en,
      nameFr: h.fr,
      nameAr: h.ar,
      isFixed: true,
      year,
    });
  }

  return { message: `Fixed holidays seeded for ${year}` };
}

module.exports = { getHolidaysByYear, addHoliday, deleteHoliday, seedFixedHolidays };
