const supabase = require('../config/supabase');

const createDonation = async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    if (!name || !email || !phone || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { data, error } = await supabase
      .from('donations')
      .insert([{ name, email, phone, amount: Number(amount) }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Donation submitted successfully!', data });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createDonation };