const jwt = require('jsonwebtoken');

function requireDoctorAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول للوصول إلى هذه البيانات' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.doctor = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مجدداً' });
  }
}

module.exports = { requireDoctorAuth };
