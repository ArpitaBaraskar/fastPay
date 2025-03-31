const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Transaction = require('../models/transaction');
const router = express.Router();
const auth = require('../routes/wallet').auth;

// Add funds to wallet
router.post('/add-funds', auth, async (req, res) => {
  const { amount, paymentMethodId } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
    });

    if (paymentIntent.status === 'succeeded') {
      const user = await User.findById(req.user);
      user.balance += amount;
      await user.save();

      const transaction = new Transaction({
        userId: req.user,
        amount,
        type: 'credit',
        description: 'Added funds via Stripe',
      });
      await transaction.save();

      res.json({ msg: 'Funds added successfully', balance: user.balance });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Make payment (deduct from wallet)
router.post('/pay', auth, async (req, res) => {
  const { amount, description } = req.body;
  try {
    const user = await User.findById(req.user);
    if (user.balance < amount) return res.status(400).json({ msg: 'Insufficient balance' });

    user.balance -= amount;
    await user.save();

    const transaction = new Transaction({
      userId: req.user,
      amount,
      type: 'debit',
      description: description || 'Payment made',
    });
    await transaction.save();

    res.json({ msg: 'Payment successful', balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;