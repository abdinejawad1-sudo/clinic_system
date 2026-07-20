const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login
// body: { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
  }

  const validUsername = username === process.env.DOCTOR_USERNAME;
  const validPassword = password === process.env.DOCTOR_PASSWORD;

  if (!validUsername || !validPassword) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  const token = jwt.sign(
    { username, role: 'doctor' },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, expiresIn: '12h' });
});

module.exports = router;
