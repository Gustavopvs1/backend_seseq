const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.post('/programacion', async (req, res) => {
  const { id_solicitud, fecha_programada, hora_asignada, turno, piso, sala_quirofano, id_anestesiologo, nombre_anestesiologo } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO programacion_quirurgica (id_solicitud, fecha_programada, hora_asignada, turno, piso, sala_quirofano, id_anestesiologo, nombre_anestesiologo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_solicitud, fecha_programada, hora_asignada, turno, piso, sala_quirofano, id_anestesiologo, nombre_anestesiologo]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se pudo guardar la solicitud' });
    }

    res.json({ message: 'Programación guardada exitosamente' });
  } catch (error) {
    console.error('Error guardando la programación:', error);
    res.status(500).json({ message: 'Error guardando la programación' });
  }
});

module.exports = router;
