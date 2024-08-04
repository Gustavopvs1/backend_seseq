const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ruta para obtener todos los usuarios
router.get('/users', (req, res) => {
    const query = 'SELECT id_usuario as id, nombre, ap_paterno, ap_materno, nivel_usuario, email FROM usuarios';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Error fetching users.' });
        }
        res.json(results);
    });
});

// Ruta para eliminar un usuario
router.delete('/users/:id', (req, res) => {
    const query = 'DELETE FROM usuarios WHERE id_usuario = ?';
    const userId = req.params.id;

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ message: 'Error deleting user.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User deleted successfully.' });
    });
});
  
// Ruta para editar un usuario
router.patch('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { nombre, ap_paterno, ap_materno, nivel_usuario, email, password, cedula } = req.body;

    let query = 'UPDATE usuarios SET ';
    let values = [];
    let fields = [];

    if (nombre) {
        fields.push('nombre = ?');
        values.push(nombre);
    }
    if (ap_paterno) {
        fields.push('ap_paterno = ?');
        values.push(ap_paterno);
    }
    if (ap_materno) {
        fields.push('ap_materno = ?');
        values.push(ap_materno);
    }
    if (nivel_usuario) {
        fields.push('nivel_usuario = ?');
        values.push(nivel_usuario);
    }
    if (email) {
        fields.push('email = ?');
        values.push(email);
    }
    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        fields.push('password = ?');
        values.push(hashedPassword);
    }
    if (cedula) {
        fields.push('cedula = ?');
        values.push(cedula);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(userId);
    query += fields.join(', ') + ' WHERE id = ?';

    console.log('Query:', query); // Debugging line
    console.log('Values:', values); // Debugging line

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ message: 'Error updating user.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'User updated successfully.' });
    });
});

module.exports = router;
