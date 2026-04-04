const balanceService = require('../services/balance.service');

async function getMyBalances(req, res) {
  try {
    const year = req.query.year || new Date().getFullYear();
    const balances = await balanceService.getUserBalances(req.user.id, year);
    res.json(balances);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getUserBalances(req, res) {
  try {
    const year = req.query.year || new Date().getFullYear();
    const balances = await balanceService.getUserBalances(parseInt(req.params.id), year);
    res.json(balances);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adjustBalance(req, res) {
  try {
    const { leaveTypeId, year, adjustment } = req.body;
    const result = await balanceService.adjustBalance(
      parseInt(req.params.id),
      leaveTypeId,
      year || new Date().getFullYear(),
      adjustment
    );
    if (!result) {
      return res.status(404).json({ error: 'Balance not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function recalculate(req, res) {
  try {
    const year = req.body.year || new Date().getFullYear();
    const result = await balanceService.recalculateBalances(year);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getMyBalances, getUserBalances, adjustBalance, recalculate };
