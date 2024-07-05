const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importar la conexión a la base de datos

const formatDateForDisplay = (date) => {
    if (!date) return null; // Devolver null si la fecha no es válida
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + d.getUTCDate()).slice(-2);
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
};

// Endpoint para obtener todos los anestesiólogos
router.get('/anestesiologos', (req, res) => {
    db.query('SELECT * FROM anestesiologos', (err, results) => {
        if (err) {
            console.error('Error fetching anestesiologos:', err);
            res.status(500).json({ error: 'Error fetching anestesiologos' });
        } else {
            // Formatear las fechas para visualización
            results.forEach(anestesiologo => {
                anestesiologo.dia_anestesio = formatDateForDisplay(anestesiologo.dia_anestesio);
                        });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});

// Endpoint para guardar un nuevo anestesiólogo
router.post('/anestesiologos', (req, res) => {
    const { nombre, hora_anestesio, dia_anestesio, turno_anestesio, sala_anestesio } = req.body;

    // Validar campos requeridos
    if (!nombre || !hora_anestesio || !dia_anestesio || !turno_anestesio || !sala_anestesio) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    const newAnestesio = {
        nombre,
        hora_anestesio,
        dia_anestesio,
        turno_anestesio,
        sala_anestesio
    };

    db.query('INSERT INTO anestesiologos SET ?', newAnestesio, (err, result) => {
        if (err) {
            console.error('Error inserting anestesiologo:', err);
            res.status(500).json({ error: 'Error inserting anestesiologo' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Anestesiólogo guardado exitosamente.', id: result.insertId });
        }
    });
});

module.exports = router;
