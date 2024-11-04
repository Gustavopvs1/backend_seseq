const express = require('express');
const router = express.Router();
const db = require('../database/db');  // Conexión a la base de datos
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');

// Endpoint para obtener todos los insumos
router.get('/insumos', async (req, res) => {
  try {
    db.query('SELECT * FROM insumos', (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener los insumos' });
      }
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Endpoint para obtener todos los insumos
router.get('/paquetes', async (req, res) => {
  try {
    db.query('SELECT * FROM paquetes', (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener los paquetes' });
      }
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

router.get('/insumos-disponibles', (req, res) => {
  // Consulta insumos
  db.query('SELECT * FROM insumos', (error, insumos) => {
    if (error) {
      console.error('Error al obtener insumos:', error);
      return res.status(500).json({ error: 'Error al obtener insumos' });
    }

    // Consulta paquetes dentro del callback de insumos
    db.query('SELECT * FROM paquetes', (error, paquetes) => {
      if (error) {
        console.error('Error al obtener paquetes:', error);
        return res.status(500).json({ error: 'Error al obtener paquetes' });
      }

      // Enviar los resultados de ambos queries juntos
      res.json({ insumos, paquetes });
    });
  });
});


// Ruta para agregar un nuevo insumo
router.post('/insumos', (req, res) => {
  const { clave, nombre, descripcion, especialidad, modulo, paquete } = req.body;

  // Verificar que los campos obligatorios estén presentes
  if (!clave || !nombre || !descripcion || !especialidad) {
    return res.status(400).json({ message: 'Clave, nombre, descripcion y especialidad son campos obligatorios' });
  }

  // Query para insertar el insumo en la base de datos
  const query = 'INSERT INTO insumos (clave, nombre, descripcion, especialidad, modulo, paquete) VALUES (?, ?, ?, ?, ?, ?)';
  
  // Ejecutar la consulta con los valores, usando NULL para campos opcionales si no se proporcionan
  db.query(query, [clave, nombre, descripcion, especialidad, modulo || null, paquete || null], (err, result) => {
    if (err) {
      console.error('Error al agregar el insumo:', err);
      return res.status(500).json({ message: 'Error al agregar el insumo' });
    }

    res.status(201).json({ message: 'Insumo agregado exitosamente', insumoId: result.insertId });
  });
});


router.post('/paquetes', (req, res) => {
  const { id_insumo, clave, nombre_insumo, nombre, descripcion } = req.body;

  // Verificar que los campos obligatorios estén presentes
  if (!id_insumo || !clave || !nombre_insumo || !nombre || !descripcion) {
    return res.status(400).json({ message: 'id_insumo, clave, nombre y descripcion son campos obligatorios' });
  }

  // Query para insertar el paquete en la base de datos
  const query = 'INSERT INTO paquetes (id_insumo, clave, nombre_insumo, nombre, descripcion) VALUES (?, ?, ?, ?, ?)';


  // Ejecutar la consulta con los valores
  db.query(query, [id_insumo, clave, nombre_insumo, nombre, descripcion], (err, result) => { // Asegúrate de incluir nombre_insumo aquí
    if (err) {
      console.error('Error al agregar el paquete:', err);
      return res.status(500).json({ message: 'Error al agregar el paquete' });
    }

    res.status(201).json({ message: 'Paquete agregado exitosamente', paqueteId: result.insertId });
  });
});

router.delete('/insumos/:idInsumo', (req, res) => {
  const { idInsumo } = req.params;
  const query = 'DELETE FROM insumos WHERE id_insumo = ?';

  db.query(query, [idInsumo], (err, result) => {
    if (err) {
      console.error('Error al eliminar el insumo:', err);
      return res.status(500).json({ message: 'Error al eliminar el insumo' });
    }

    res.status(200).json({ message: 'Insumo eliminado correctamente' });
  });
});

router.post('/insumos/:idInsumo/paquetes', (req, res) => {
  const { idInsumo } = req.params;
  const { paquetes } = req.body;
  const paquetesNombres = paquetes.join(', ');

  const query = 'UPDATE insumos SET paquete = ? WHERE id_insumo = ?';
  db.query(query, [paquetesNombres, idInsumo], (err) => {
    if (err) {
      console.error('Error al asociar paquetes al insumo:', err);
      return res.status(500).json({ message: 'Error al asociar paquetes al insumo' });
    }

    res.status(200).json({ message: 'Paquetes asociados correctamente al insumo' });
  });
});



// Configuración de multer para manejar la subida de archivos
const upload = multer({ dest: 'uploads/' });

// Ruta para obtener columnas del archivo CSV
router.post('/insumos/obtener-columnas', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  const fileExtension = req.file.originalname.split('.').pop();

  if (fileExtension === 'csv') {
    const columns = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        headers.forEach((header) => columns.push(header));
      })
      .on('end', () => {
        fs.unlinkSync(filePath); // Eliminar el archivo después de leer las columnas
        res.json({ columns });
      });
  } else if (fileExtension === 'xlsx') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    const columns = sheetData[0];

    fs.unlinkSync(filePath); // Eliminar el archivo después de leer las columnas
    res.json({ columns });
  } else {
    res.status(400).json({ message: 'Formato de archivo no compatible. Usa CSV o Excel.' });
  }
});

router.post('/insumos/upload-with-mapping', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const mapping = JSON.parse(req.body.mapping); // Convertir el mapeo de columnas a objeto

  const fileExtension = req.file.originalname.split('.').pop();
  const insumos = [];

  const insertData = (row) => {
    const insumo = dbColumns.map(dbColumn => row[mapping[dbColumn]] || null);
    insumos.push(insumo);
  };

  if (fileExtension === 'csv') {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', insertData)
      .on('end', () => {
        insertIntoDatabase(insumos, res, filePath);
      });
  } else if (fileExtension === 'xlsx') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    sheetData.forEach(insertData);

    insertIntoDatabase(insumos, res, filePath);
  } else {
    res.status(400).json({ message: 'Formato de archivo no compatible' });
  }
});

function insertIntoDatabase(insumos, res, filePath) {
  const query = 'INSERT INTO insumos (clave, nombre, descripcion, especialidad, modulo, paquete) VALUES ?';
  db.query(query, [insumos], (err, result) => {
    fs.unlinkSync(filePath); // Eliminar el archivo después de procesarlo

    if (err) {
      console.error('Error al insertar insumos:', err);
      return res.status(500).json({ message: 'Error al insertar insumos' });
    }

    res.status(201).json({ message: 'Insumos cargados exitosamente', insertedRows: result.affectedRows });
  });
}
// Ruta para cargar insumos desde un archivo Excel
router.post('/insumos/upload/xlsx', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const insumos = sheetData.map(row => {
    const { clave, nombre, descripcion, especialidad, modulo, paquete } = row;
    if (clave && nombre && descripcion && especialidad) {
      return [clave, nombre, descripcion, especialidad, modulo || null, paquete || null];
    }
    return null;
  }).filter(row => row !== null);

  const query = 'INSERT INTO insumos (clave, nombre, descripcion, especialidad, modulo, paquete) VALUES ?';
  db.query(query, [insumos], (err, result) => {
    fs.unlinkSync(filePath); // Eliminar el archivo después de procesarlo

    if (err) {
      console.error('Error al insertar insumos:', err);
      return res.status(500).json({ message: 'Error al insertar insumos' });
    }

    res.status(201).json({ message: 'Insumos cargados exitosamente', insertedRows: result.affectedRows });
  });
});

router.post('/vista-previa', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const fileExtension = req.file.originalname.split('.').pop();
  const previewData = [];

  if (fileExtension === 'csv') {
    fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))  // Desactiva los encabezados para obtener los datos en bruto
      .on('data', (row) => {
        previewData.push(Object.values(row)); // Guarda los valores de la fila como un array
        if (previewData.length >= 5) { // Limita la vista previa a las primeras 5 filas
          this.destroy(); // Detiene la lectura del archivo
        }
      })
      .on('end', () => {
        fs.unlinkSync(filePath); // Elimina el archivo después de leer
        res.json({ previewData });
      });
  } else if (fileExtension === 'xlsx') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
    const previewData = sheetData.slice(0, 5); // Toma las primeras 5 filas
    fs.unlinkSync(filePath); // Elimina el archivo después de leer
    res.json({ previewData });
  } else {
    res.status(400).json({ message: 'Formato de archivo no compatible. Usa CSV o Excel.' });
  }
});

router.post('/insumos/upload-without-headers', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const mapping = JSON.parse(req.body.mapping); // Convertir el mapeo de columnas a objeto

  const fileExtension = req.file.originalname.split('.').pop();
  const insumos = [];

  const insertData = (row) => {
    const insumo = dbColumns.map((dbColumn) => row[mapping[dbColumn]] || null);
    insumos.push(insumo);
  };

  if (fileExtension === 'csv') {
    fs.createReadStream(filePath)
      .pipe(csv({ headers: false })) // Sin encabezados
      .on('data', insertData)
      .on('end', () => {
        insertIntoDatabase(insumos, res, filePath);
      });
  } else if (fileExtension === 'xlsx') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    sheetData.forEach(insertData);

    insertIntoDatabase(insumos, res, filePath);
  } else {
    res.status(400).json({ message: 'Formato de archivo no compatible' });
  }
});

function insertIntoDatabase(insumos, res, filePath) {
  const query = 'INSERT INTO insumos (clave, nombre, descripcion, especialidad, modulo, paquete) VALUES ?';
  db.query(query, [insumos], (err, result) => {
    fs.unlinkSync(filePath); // Eliminar el archivo después de procesarlo

    if (err) {
      console.error('Error al insertar insumos:', err);
      return res.status(500).json({ message: 'Error al insertar insumos' });
    }

    res.status(201).json({ message: 'Insumos cargados exitosamente', insertedRows: result.affectedRows });
  });
}


module.exports = router;
