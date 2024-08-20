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
                
                // Convertir sala_anestesio de cadena de texto a array
                if (anestesiologo.sala_anestesio) {
                    anestesiologo.sala_anestesio = anestesiologo.sala_anestesio.split(',');
                }
            });
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        }
    });
});

// Endpoint para guardar un nuevo anestesiólogo
router.post('/anestesiologos', (req, res) => {
    let { nombre, dia_anestesio, turno_anestesio, sala_anestesio, hora_inicio, hora_fin } = req.body;

    // Validar campos requeridos
    if (!nombre || !dia_anestesio || !turno_anestesio || !sala_anestesio || !hora_inicio || !hora_fin) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    // Verificar si sala_anestesio es un array. Si es así, unirlo en una cadena de texto.
    if (Array.isArray(sala_anestesio)) {
        sala_anestesio = sala_anestesio.join(','); // Convertir array a string separada por comas
    }

    const newAnestesio = {
        nombre,
        dia_anestesio,
        turno_anestesio,
        sala_anestesio,
        hora_inicio,
        hora_fin
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


// Actualizar un anestesiólogo
router.patch('/anestesiologos/:id', (req, res) => {
    const id = req.params.id;
    const updatedFields = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID del anestesiólogo no proporcionado' });
    }

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    // Convertir sala_anestesio de array a string si es necesario
    if (updatedFields.sala_anestesio && Array.isArray(updatedFields.sala_anestesio)) {
        updatedFields.sala_anestesio = updatedFields.sala_anestesio.join(',');
    }

    db.query('UPDATE anestesiologos SET ? WHERE id_anestesiologo = ?', [updatedFields, id], (err, result) => {
        if (err) {
            console.error('Error actualizando anestesiólogo:', err);
            res.status(500).json({ error: 'Error actualizando anestesiólogo' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Anestesiólogo no encontrado' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json({ message: 'Anestesiólogo actualizado exitosamente.' });
        }
    });
});

// Nuevo endpoint para obtener el anestesiólogo asignado según la fecha, turno y sala
// Nuevo endpoint para obtener el anestesiólogo asignado según la fecha, turno y sala
// Nuevo endpoint para obtener el anestesiólogo asignado según la fecha, turno y sala
router.get('/anestesiologo', (req, res) => {
    const { fecha_programada, turno, sala_quirofano } = req.query;

    if (!fecha_programada || !turno || !sala_quirofano) {
        return res.status(400).json({ error: 'Los parámetros fecha_programada, turno y sala_quirofano son requeridos.' });
    }

    const query = `
        SELECT nombre
        FROM anestesiologos
        WHERE dia_anestesio = ? AND turno_anestesio = ? AND FIND_IN_SET(?, sala_anestesio) > 0
    `;

    db.query(query, [fecha_programada, turno, sala_quirofano], (err, results) => {
        if (err) {
            console.error('Error fetching anestesiologo:', err);
            res.status(500).json({ error: 'Error fetching anestesiologo' });
        } else {
            if (results.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.json(results[0]);
            } else {
                res.status(404).json({ error: 'No se encontró un anestesiólogo asignado para los parámetros proporcionados.' });
            }
        }
    });
});



router.delete('/anestesiologos/:id', (req, res) => {
    const { id } = req.params;
  
    db.connect((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        return res.status(500).json({ message: 'Error al obtener conexión' });
      }
  
      connection.query('DELETE FROM anestesiologos WHERE id_anestesiologo = ?', [id], (error, result) => {
        if (error) {
          console.error('Error deleting anesthesiologist:', error);
          return res.status(500).json({ message: 'Error al eliminar el anestesiólogo' });
        }
  
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Anestesiólogo no encontrado' });
        }
  
        res.status(200).json({ message: 'Anestesiólogo eliminado con éxito' });
  
        // No cierres la conexión aquí
        // connection.end();
      });
    });
  });
  
  

module.exports = router;
