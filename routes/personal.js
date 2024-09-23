const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importar la conexión a la base de datos local

// Ruta para obtener todo el personal
router.get('/', (req, res) => {
    db.query('SELECT * FROM personal', (err, results) => {
        if (err) {
            console.error('Error al obtener el personal:', err);
            res.status(500).send('Error al obtener el personal.');
        } else {
            res.json(results);
        }
    });
});

module.exports = router;
