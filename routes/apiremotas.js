const express = require('express');
const router = express.Router();
const connectToDb = require('../database/dbremote'); // Asegúrate de que la ruta es correcta

// Endpoint para obtener todos los datos de vw-Medicos
router.get('/medicos', async (req, res) => {
    try {
        const dbRemote = await connectToDb(); // Esperar la conexión a la base de datos

        const query = 'SELECT * FROM vw_Medicos';

        dbRemote.query(query, (error, results) => {
            if (error) {
                console.error('Error fetching data from vw_Medicos:', error);
                res.status(500).json({ error: 'Error fetching data from vw_Medicos' });
                return;
            }

            res.json(results);
        });
    } catch (error) {
        console.error('Error establishing SSH connection:', error);
        res.status(500).json({ error: 'Error establishing SSH connection' });
    }
});

module.exports = router;
