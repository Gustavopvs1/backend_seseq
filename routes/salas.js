const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Obtener todas las salas
router.get('/salas', (req, res) => {
    const query = 'SELECT * FROM salas_quirofano';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching salas:', err);
            return res.status(500).json({ message: 'Error fetching salas.' });
        }
        res.json(results);
    });
});

// Actualizar el estado de una sala
router.put('/salas/:id', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Solo actualiza ultima_actualizacion si el estado es 'false' (apagado)
    const query = estado
        ? 'UPDATE salas_quirofano SET estado = ? WHERE id = ?'
        : 'UPDATE salas_quirofano SET estado = ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = ?';
    
    const values = estado
        ? [estado, id]
        : [estado, id];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error updating sala state:', err);
            return res.status(500).json({ message: 'Error updating sala state.' });
        }
        res.status(200).json({ message: 'Estado de la sala actualizado correctamente' });
    });
});


module.exports = router;
