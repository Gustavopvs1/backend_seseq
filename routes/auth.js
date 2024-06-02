const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'seseq'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret'; // Cambia esto por una clave secreta segura

router.post('/register', async (req, res) => {
    const { nombre, ap_paterno, ap_materno, email, password, nivel_usuario, cedula } = req.body;

    console.log('Datos recibidos del frontend:', req.body); // Para verificar los datos recibidos

    if (!nombre || !ap_paterno || !ap_materno || !email || !password || !nivel_usuario || !cedula) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO usuarios (nombre, ap_paterno, ap_materno, email, contraseña, nivel_usuario, cedula) VALUES (?, ?, ?, ?, ?, ?, ?)';

        db.query(query, [nombre, ap_paterno, ap_materno, email, hashedPassword, nivel_usuario, cedula], (err, results) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Error registering user.');
            }
            res.status(201).send('User registered successfully.');
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user.');
    }
});
// Ruta para autenticar un usuario
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Error logging in.');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid email or password.');
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.contraseña);

        if (!isPasswordValid) {
            return res.status(401).send('Invalid email or password.');
        }

        // Generar un token JWT y enviarlo al cliente
        const token = jwt.sign({ id: user.id_usuario, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful.', token });
    });
});

module.exports = router;
