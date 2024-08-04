const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Asegúrate de que esta ruta apunta a tu archivo de conexión de la base de datos

// Obtener todas las salas
router.get('/salas', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM salas_quirofano');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar el estado de una sala
router.put('/salas/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        await db.query('UPDATE salas_quirofano SET estado = ? WHERE id = ?', [estado, id]);
        res.status(200).json({ message: 'Estado de la sala actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
