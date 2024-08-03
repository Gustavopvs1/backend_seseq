// salasRoutes.js (rutas de Express)
const express = require('express');
const router = express.Router();
const Salas = require('./models/Salas'); // Tu modelo de sala

// Obtener todas las salas
router.get('/salas', async (req, res) => {
  try {
    const salas = await Salas.find();
    res.json(salas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Actualizar el estado de una sala
router.put('/salas/:id', async (req, res) => {
  try {
    const sala = await Salas.findById(req.params.id);
    if (!sala) return res.status(404).json({ message: 'Sala no encontrada' });

    sala.disponible = req.body.disponible;
    await sala.save();
    res.json(sala);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
