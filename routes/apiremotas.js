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

router.get('/anestesiologos/activos', async (req, res) => {
  try {
      const search = req.query.search || '';
      const dbRemote = await connectToDb(); // Esperar la conexión a la base de datos

      const query = `
SELECT 
CONCAT(TRIM(Nombre), ' ', TRIM(Paterno), ' ', TRIM(Materno)) AS nombre_completo
FROM 
vw_Medicos
WHERE 
Puesto IN (
  'MEDICO ESPECIALISTA "A"',
  'MEDICO ESPECIALISTA "B"',
  'MEDICO ESPECIALISTA "C"',
  'MEDICO GENERAL "A"',
  'MEDICO GENERAL "B"',
  'MEDICO GENERAL "C"',
  'MEDICO RESIDENTE 1ER GRADO',
  'MEDICO RESIDENTE 2DO GRADO',
  'MEDICO RESIDENTE 3ER GRADO',
  'MEDICO RESIDENTE 4TO GRADO'
) 
AND Status = 'Activo'
AND CONCAT(TRIM(Nombre), ' ', TRIM(Paterno), ' ', TRIM(Materno)) LIKE ?
      `;

      dbRemote.query(query, [`%${search}%`], (error, results) => {
          if (error) {
              console.error('Error fetching active anesthesiologists:', error);
              res.status(500).json({ error: 'Error fetching active anesthesiologists' });
              return;
          }

          res.json(results);
      });
  } catch (error) {
      console.error('Error establishing SSH connection:', error);
      res.status(500).json({ error: 'Error establishing SSH connection' });
  }
});



router.get('/cirujanos/activos', async (req, res) => {
  try {
      const search = req.query.search || '';
      const dbRemote = await connectToDb(); // Esperar la conexión a la base de datos

      const query = `
SELECT 
CONCAT(TRIM(Nombre), ' ', TRIM(Paterno), ' ', TRIM(Materno)) AS nombre_completo
FROM 
vw_Medicos
WHERE 
Puesto IN (
  'MEDICO ESPECIALISTA "A"',
  'MEDICO ESPECIALISTA "B"',
  'MEDICO ESPECIALISTA "C"',
  'MEDICO GENERAL "A"',
  'MEDICO GENERAL "B"',
  'MEDICO GENERAL "C"',
  'MEDICO RESIDENTE 1ER GRADO',
  'MEDICO RESIDENTE 2DO GRADO',
  'MEDICO RESIDENTE 3ER GRADO',
  'MEDICO RESIDENTE 4TO GRADO'
) 
AND Status = 'Activo'
AND CONCAT(TRIM(Nombre), ' ', TRIM(Paterno), ' ', TRIM(Materno)) LIKE ?
      `;

      dbRemote.query(query, [`%${search}%`], (error, results) => {
          if (error) {
              console.error('Error fetching active surgeons:', error);
              res.status(500).json({ error: 'Error fetching active surgeons' });
              return;
          }

          res.json(results);
      });
  } catch (error) {
      console.error('Error establishing SSH connection:', error);
      res.status(500).json({ error: 'Error establishing SSH connection' });
  }
});

router.get('/enfermeras/activos', async (req, res) => {
  try {
      const search = req.query.search || '';
      const dbRemote = await connectToDb(); // Esperar la conexión a la base de datos

      const query = `
SELECT 
CONCAT(TRIM(Nombre), ' ', TRIM(Paterno), ' ', TRIM(Materno)) AS nombre_completo
FROM 
vw_Medicos
WHERE 
Puesto IN (
  'AUXILIAR DE ENFERMERIA "A"',
  'AUXILIAR DE ENFERMERIA "B"',
  'ENFERMERA ESPECIALISTA "A"',
  'ENFERMERA ESPECIALISTA "B"',
  'ENFERMERA ESPECIALISTA "C"',
  'ENFERMERA GENERAL TECNICA',
  'ENFERMERA GENERAL TITULADA "A"',
  'ENFERMERA GENERAL TITULADA "B"',
  'ENFERMERA GENERAL TITULADA "C"',
  'ENFERMERA JEFE DE SERVICIO',
  'ENFERMERA PASANTE "A"'
) 
AND Status = 'Activo'
AND CONCAT(TRIM(Nombre), ' ', TRIM(Paterno), ' ', TRIM(Materno)) LIKE ?
      `;

      dbRemote.query(query, [`%${search}%`], (error, results) => {
          if (error) {
              console.error('Error fetching active nurses:', error);
              res.status(500).json({ error: 'Error fetching active nurses' });
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
