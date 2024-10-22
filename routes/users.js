const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');

// Ruta para obtener todos los usuarios
router.get('/users', (req, res) => {
    const query = 'SELECT * FROM usuarios';

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
    const { nombre, ap_paterno, ap_materno, nivel_usuario, email, password, cedula, pantallasDisponibles, especialidad, turno  } = req.body;

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
        fields.push('contraseña = ?');
        values.push(hashedPassword);
    }
    if (cedula) {
        fields.push('cedula = ?');
        values.push(cedula);
    }
    if (pantallasDisponibles) {
        fields.push('pantallasDisponibles = ?');
        values.push(pantallasDisponibles); // Ya está como una cadena
    }
    if (especialidad) {
        fields.push('especialidad = ?');
        values.push(especialidad);
    }
    if (turno) {
        fields.push('turno = ?');
        values.push(turno);
    }
    if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(userId);
    query += fields.join(', ') + ' WHERE id_usuario = ?';

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

// Ruta para actualizar la contraseña de un usuario
router.patch('/password/:id', async (req, res) => {
    const userId = req.params.id;
    const { newPassword, confirmPassword } = req.body;

    try {
        // Validaciones
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ 
                message: 'Se requieren ambos campos de contraseña.' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                message: 'Las contraseñas no coinciden.' 
            });
        }

        // Validación adicional de longitud de contraseña si lo deseas
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'La contraseña debe tener al menos 6 caracteres.' 
            });
        }

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar la contraseña en la base de datos
        const query = 'UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?';
        db.query(query, [hashedPassword, userId], (err, result) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.status(500).json({ 
                    message: 'Error al actualizar la contraseña en la base de datos.' 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    message: 'Usuario no encontrado.' 
                });
            }

            res.json({ message: 'Contraseña actualizada exitosamente.' });
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).json({ 
            message: 'Error al procesar la contraseña.' 
        });
    }
});

// Ruta para obtener pantallas disponibles para un usuario
router.get('/users/:id/screens', (req, res) => {
    const userId = req.params.id;

    const query = 'SELECT pantallas_disponibles FROM usuarios WHERE id_usuario = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user screens:', err);
            return res.status(500).json({ message: 'Error fetching user screens.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const screens = results[0].pantallasDisponibles ? JSON.parse(results[0].pantallasDisponibles) : [];
        res.json(screens);
    });
});

module.exports = router;
