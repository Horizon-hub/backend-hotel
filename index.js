const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const port = 3002;
const SECRET_KEY = 'your_jwt_secret_key'; // Use env variable in production

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const pool = new Pool({
  connectionString:"postgresql://postgres:syriahotel$10213123@db.usjlvzxargnzqddtppnb.supabase.co:5432/postgres"
})


app.get('/api/locations', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM "Location"');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/sign-in', async (req, res) => {
  const { name, password } = req.body;

  try {
    const query = `SELECT * FROM "Hotel" WHERE name = $1 AND password = $2`;
    const values = [name, password];
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, name: user.name }, // payload
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Login successful', token , id: user.id });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>
  
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }
  
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
  
      req.user = user; // You can access this in your route
      next();
    });
  }
  app.use(authenticateToken);
  app.get('/api/rooms', async (req, res) => {
    try {
      const query = `SELECT * FROM "Room" where hotel_id = $1`;
        const values = [req.user.id]; // Assuming you have hotel_id in the token payload

      const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
        }
  });
  app.post('/api/rooms', async (req, res) => {
    const { name, price,description} = req.body;
  
    try {
      const query = `INSERT INTO "Room" (name, price,description, hotel_id) VALUES ($1, $2, $3, $4)`;
      const values = [name, price,description, req.user.id]; // Assuming you have hotel_id in the token payload

      await pool.query(query, values);
      res.status(201).json({ message: 'Room created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  app.delete('/api/rooms/:id', async (req, res) => {
    const roomId = req.params.id;
  
    try {
      const query = `DELETE FROM "Room" WHERE id = $1 AND hotel_id = $2`;
      const values = [roomId, req.user.id]; // Assuming you have hotel_id in the token payload

      await pool.query(query, values);
      res.status(200).json({ message: 'Room deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  })


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
