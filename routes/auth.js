const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db'); // Importar la conexión a la base de datos

const JWT_SECRET = 'your_jwt_secret';

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Registrar un usuario
router.post('/register', async (req, res) => {
    const { nombre, ap_paterno, ap_materno, email, password, nivel_usuario, cedula } = req.body;

    if (!nombre || !ap_paterno || !ap_materno || !email || !password || !nivel_usuario || !cedula) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO usuarios (nombre, ap_paterno, ap_materno, email, contraseña, nivel_usuario, cedula) VALUES (?, ?, ?, ?, ?, ?, ?)';

        db.query(query, [nombre, ap_paterno, ap_materno, email, hashedPassword, nivel_usuario, cedula], (err, results) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Error registering user.' });
            }
            res.status(201).json({ message: 'User registered successfully.' });
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json('Error registering user.');
    }
});

// Autenticar un usuario
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ message: 'Error login in' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Correo electrónico o contraseña inválidos' });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.contraseña);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Correo electrónico o contraseña inválidos' });
        }

        const token = jwt.sign({ id: user.id_usuario, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful.', token });
    });
});

// Ruta para obtener información del usuario autenticado
router.get('/user', authenticateToken, (req, res) => {
    const query = 'SELECT nombre, ap_paterno, ap_materno FROM usuarios WHERE id_usuario = ?';

    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching user info:', err);
            return res.status(500).json({ message: 'Error fetching user info.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = results[0];
        res.json({
            nombre: user.nombre,
            ap_paterno: user.ap_paterno,
            ap_materno: user.ap_materno,
        });
    });
});


module.exports = router;
