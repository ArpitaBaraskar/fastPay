const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/transaction');
const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    res.json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;