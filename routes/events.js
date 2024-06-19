const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ruta para actualizar un evento
router.put('/events', async (req, res) => {
  const { id, start, end } = req.body;

  try {
    // Actualizar el evento en la base de datos
    const result = await db.query(
      'UPDATE programacion_quirurgica SET start = ?, end = ? WHERE id = ?',
      [start, end, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    res.json({ message: 'Evento actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando el evento:', error);
    res.status(500).json({ message: 'Error actualizando el evento' });
  }
});

module.exports = router;
