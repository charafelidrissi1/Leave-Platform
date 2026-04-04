const holidayService = require('../services/holiday.service');

async function getHolidays(req, res) {
  try {
    const year = req.query.year || new Date().getFullYear();
    const holidays = await holidayService.getHolidaysByYear(year);
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function addHoliday(req, res) {
  try {
    const { holidayDate, nameEn, nameFr, nameAr, isFixed, year } = req.body;
    const holiday = await holidayService.addHoliday({ holidayDate, nameEn, nameFr, nameAr, isFixed, year });
    res.status(201).json(holiday);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteHoliday(req, res) {
  try {
    const holiday = await holidayService.deleteHoliday(parseInt(req.params.id));
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.json({ message: 'Deleted', holiday });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function seedHolidays(req, res) {
  try {
    const year = req.body.year || new Date().getFullYear();
    const result = await holidayService.seedFixedHolidays(year);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getHolidays, addHoliday, deleteHoliday, seedHolidays };
