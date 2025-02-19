const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret';

// Verify Token
exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }
   
  try {
    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
    req.user = decoded;
   
    next();
  } catch (error) {
    console.log(error.response.data);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Role-Based Access Control
exports.checkRole = (roles) => (req, res, next) => {
  
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
