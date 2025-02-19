const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const airtable = require('../config/airtable');
const tableName = 'Users';

const JWT_SECRET = 'your_jwt_secret'; // Change this to a strong secret

// Signup
exports.signup = async (req, res) => {
  
  const { username, email, password, role } = req.body;
  try {
    // Check if user already exists
    const checkUser = await airtable.get(
      `/${tableName}?filterByFormula={Email}="${email}"`
    );

    if (checkUser.data.records.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user in Airtable
    const response = await airtable.post(`/${tableName}`, {
      fields: {
        Username: username,
        Email: email,
        Password: hashedPassword,
        Role: role,
      },
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const userResponse = await airtable.get(
      `/${tableName}?filterByFormula={Email}="${email}"`
    );

    if (userResponse.data.records.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResponse.data.records[0].fields;
    const userId = userResponse.data.records[0].id;

    // Compare password
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId,
        username: user.Username,
        role: user.Role,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, role: user.Role });
  } catch (error) {
    console.log(error.response.data);
    res.status(500).json({ error: error.message });
  }
};
