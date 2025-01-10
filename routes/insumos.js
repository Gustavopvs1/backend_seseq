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


// Endpoint para obtener todos los materiales adicionales
router.get('/materiales-adicionales', async (req, res) => {
  try {
    db.query('SELECT * FROM material_adicional', (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener los materiales adicionales' });
      }
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});


// Endpoint para obtener todos los medicamentos
router.get('/medicamentos', async (req, res) => {
  try {
    db.query('SELECT * FROM medicamentos', (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener los medicamentos' });
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

router.get('/paquete-insumos', (req, res) => {
  const query = `
    SELECT 
      pi.id,
      pi.paquete_id,
      p.nombre AS nombre_paquete,
      p.descripcion AS descripcion_paquete,
      pi.insumo_id,
      i.clave AS clave_insumo,
      i.descripcion AS descripcion_insumo,
      pi.cantidad_default
    FROM 
      paquete_insumos pi
    JOIN 
      paquetes p ON pi.paquete_id = p.id
    JOIN 
      insumos i ON pi.insumo_id = i.id_insumo
  `;

  db.query(query, (error, resultados) => {
    if (error) {
      console.error('Error al obtener paquete-insumos:', error);
      return res.status(500).json({ error: 'Error al obtener paquete-insumos' });
    }

    // Transformar los resultados para agrupar por paquete si es necesario
    const paqueteInsumos = resultados.reduce((acumulador, item) => {
      // Buscar si el paquete ya existe en el acumulador
      let paqueteExistente = acumulador.find(
        paquete => paquete.paquete_id === item.paquete_id
      );

      // Si no existe, crear un nuevo objeto de paquete
      if (!paqueteExistente) {
        paqueteExistente = {
          paquete_id: item.paquete_id,
          nombre_paquete: item.nombre_paquete,
          descripcion_paquete: item.descripcion_paquete,
          insumos: []
        };
        acumulador.push(paqueteExistente);
      }

      // Agregar el insumo al paquete
      paqueteExistente.insumos.push({
        insumo_id: item.insumo_id,
        clave_insumo: item.clave_insumo,
        descripcion_insumo: item.descripcion_insumo,
        cantidad_default: item.cantidad_default
      });

      return acumulador;
    }, []);

    res.json(paqueteInsumos);
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

router.post('/solicitudes-insumos/:id_solicitud', (req, res) => {
  const { id_solicitud } = req.params;
  const { insumos, resumen_medico } = req.body; // Ahora incluye resumen_medico y detalle_paquete

  if (!Array.isArray(insumos) || insumos.length === 0) {
    return res.status(400).json({ message: 'Se requiere un array de insumos' });
  }

  const values = insumos.map((insumo) => [
    id_solicitud,
    insumo.tipo_insumo,
    insumo.insumo_id || null,
    insumo.nombre_insumo,
    insumo.cantidad,
    insumo.disponibilidad || 0, // Por defecto, no disponible
    insumo.estado_insumos || 'Sin solicitud', // Estado por defecto
    insumo.detalle_paquete || null, // Detalle del paquete o null si no aplica
  ]);

  const queryInsumos = `
    INSERT INTO solicitud_insumos 
    (id_solicitud, tipo_insumo, insumo_id, nombre_insumo, cantidad, disponibilidad, estado_insumos, detalle_paquete)
    VALUES ?
  `;

  const queryResumen = `
    UPDATE solicitudes_cirugia
    SET resumen_medico = ?
    WHERE id_solicitud = ?
  `;

  db.query(queryInsumos, [values], (err, result) => {
    if (err) {
      console.error('Error al insertar insumos:', err);
      return res.status(500).json({ message: 'Error al insertar insumos', error: err });
    }

    db.query(queryResumen, [resumen_medico, id_solicitud], (err) => {
      if (err) {
        console.error('Error al actualizar resumen_medico:', err);
        return res.status(500).json({ message: 'Error al actualizar resumen_medico', error: err });
      }

      res.json({
        message: 'Insumos, detalle de paquetes y resumen médico guardados correctamente',
        insertedRows: result.affectedRows,
      });
    });
  });
});


router.get('/solicitudes-insumos/:id_solicitud', (req, res) => {
  const { id_solicitud } = req.params;

  const query = `
    SELECT 
      si.id,
      si.tipo_insumo,
      si.insumo_id,
      si.nombre_insumo,
      si.cantidad,
      si.disponibilidad,
      si.estado_insumos,
      si.detalle_paquete,
      sc.folio,
      sc.ap_paterno,
      sc.ap_materno,
      sc.nombre_paciente,
      sc.sexo,
      sc.tipo_admision,
      sc.tipo_intervencion,
      sc.nombre_especialidad,
      sc.fecha_solicitada,
      sc.hora_solicitada,
      sc.sala_quirofano,
      sc.procedimientos_paciente,
      sc.nombre_cirujano,
      sc.procedimientos_paciente,
      sc.diagnostico,
      sc.resumen_medico
    FROM solicitud_insumos si
    JOIN solicitudes_cirugia sc ON si.id_solicitud = sc.id_solicitud
    WHERE si.id_solicitud = ?
  `;

  db.query(query, [id_solicitud], (err, results) => {
    if (err) {
      console.error('Error al obtener insumos y datos del paciente:', err);
      return res.status(500).json({ message: 'Error al obtener insumos y datos del paciente', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No se encontraron insumos para esta solicitud' });
    }

    res.json(results);
  });
});

router.patch('/insumos-disponibles/:id_solicitud', (req, res) => {
  const { id_solicitud } = req.params;
  const insumosActualizados = req.body;
  
  const deleteQuery = `
    DELETE FROM solicitud_insumos 
    WHERE id_solicitud = ? AND insumo_id = ?`;
    
  const updateQuery = `
    UPDATE solicitud_insumos 
    SET disponibilidad = ?, cantidad = ?
    WHERE id_solicitud = ? AND insumo_id = ?`;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: err });

    insumosActualizados.forEach(insumo => {
      if (insumo.eliminar) {
        db.query(deleteQuery, [id_solicitud, insumo.insumo_id], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ error: err }));
        });
      } else {
        db.query(updateQuery, 
          [insumo.disponibilidad, insumo.cantidad, id_solicitud, insumo.insumo_id], 
          (err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err }));
          }
        );
      }
    });

    db.commit((err) => {
      if (err) return db.rollback(() => res.status(500).json({ error: err }));
      res.json({ message: 'Insumos actualizados correctamente' });
    });
  });
});


/* // Endpoint para actualizar datos en solicitudes_cirugia
router.patch('/solicitudes-insumos/:id', (req, res) => {
  const { id } = req.params;
  const {
    material_adicional,
    material_externo,
    servicios,
    nombre_paquete,
    medicamentos,
    estado_insumos,
    cantidad_adicional,
    cantidad_externo,
    cantidad_servicios,
    cantidad_paquete,
    cantidad_medicamento,
    resumen_medico,
    disponibilidad_adicional,
    disponibilidad_externo,
    disponibilidad_servicios,
    disponibilidad_paquetes,
    disponibilidad_medicamentos
  } = req.body;

  // Validación y manejo de campos que pueden ser arreglos
  const dataToUpdate = {
    material_adicional: Array.isArray(material_adicional) ? material_adicional.join(', ') : material_adicional || null,
    material_externo: Array.isArray(material_externo) ? material_externo.join(', ') : material_externo || null,
    servicios: Array.isArray(servicios) ? servicios.join(', ') : servicios || null,
    nombre_paquete: nombre_paquete || null,
    estado_insumos: estado_insumos || 'Sin solicitud', // Valor por defecto
    cantidad_adicional: Array.isArray(cantidad_adicional) ? cantidad_adicional.join(', ') : cantidad_adicional || null,
    cantidad_externo: cantidad_externo || null,
    cantidad_servicios: cantidad_servicios || null,
    cantidad_paquete: cantidad_paquete || null,
    resumen_medico: resumen_medico || null,
    disponibilidad_adicional: disponibilidad_adicional || "0",
    disponibilidad_externo: disponibilidad_externo || "0",
    disponibilidad_servicios: disponibilidad_servicios || "0",
    disponibilidad_paquetes: disponibilidad_paquetes || "0",
    disponibilidad_medicamentos: disponibilidad_medicamentos || "0"
  };

  // Generar query dinámico para actualizar solo los campos enviados
  const fields = Object.keys(dataToUpdate)
    .map((key) => `${key} = ?`)
    .join(', ');

  const values = Object.values(dataToUpdate);

  // Ejecutar la actualización en la base de datos
  const query = `UPDATE solicitudes_cirugia SET ${fields} WHERE id_solicitud = ?`;

  db.query(query, [...values, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar solicitud:', err);
      return res.status(500).json({ message: 'Error al actualizar solicitud', error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    res.json({ message: 'Solicitud actualizada correctamente', id });
  });
});
 */

router.patch('/insumos-disponibles/:id', (req, res) => {
  console.log("Datos recibidos:", req.body)
  const id = req.params.id;
  const {
    material_adicional = '',
    material_externo = '',
    servicios = '',
    nombre_paquete = '',
    medicamentos = '',
    cantidad_adicional = '',
    cantidad_externo = '',
    cantidad_servicios = '',
    cantidad_paquete = '',
    cantidad_medicamento = '',
    disponibilidad_material_adicional = '',
    disponibilidad_material_externo = '',
    disponibilidad_servicios = '',
    disponibilidad_paquetes = '',
    disponibilidad_medicamentos = '',
    comentarios_insumos = ''
  } = req.body;

  // Filtrar las categorías que tienen datos para validar
  const categoriasConDatos = [
    [material_adicional, cantidad_adicional, disponibilidad_material_adicional],
    [material_externo, cantidad_externo, disponibilidad_material_externo],
    [servicios, cantidad_servicios, disponibilidad_servicios],
    [nombre_paquete, cantidad_paquete, disponibilidad_paquetes],
    [medicamentos, cantidad_medicamento, disponibilidad_medicamentos]
  ].filter(([item]) => item !== '');

  const validacionArrays = categoriasConDatos.every(([item, cantidad, disponibilidad]) =>
    cantidad && disponibilidad &&
    item.split(',').length === cantidad.split(',').length &&
    cantidad.split(',').length === disponibilidad.split(',').length
  );

  if (!validacionArrays) {
    return res.status(400).json({
      error: 'Los arrays de materiales, cantidades y disponibilidades deben tener la misma longitud para cada categoría con datos.'
    });
  }

  // Calcular estado: "Disponible" si todos disponibles, "Solicitado" si falta al menos uno
  const disponibilidades = [
    ...disponibilidad_material_adicional.split(','),
    ...disponibilidad_material_externo.split(','),
    ...disponibilidad_servicios.split(','),
    ...disponibilidad_paquetes.split(','),
    ...disponibilidad_medicamentos.split(',')
  ].filter(Boolean); // Ignorar valores vacíos

  const todosDisponibles = disponibilidades.every(d => d === '1');
  const estado_insumos = todosDisponibles ? 'Disponible' : 'Solicitado';

  // Query para actualizar en la base de datos
  const query = `
    UPDATE solicitudes_cirugia
    SET 
      material_adicional = ?,
      material_externo = ?,
      servicios = ?,
      nombre_paquete = ?,
      medicamentos = ?,
      cantidad_adicional = ?,
      cantidad_externo = ?,
      cantidad_servicios = ?,
      cantidad_paquete = ?,
      cantidad_medicamento = ?,
      disponibilidad_adicional = ?,
      disponibilidad_externo = ?,
      disponibilidad_servicios = ?,
      disponibilidad_paquetes = ?,
      disponibilidad_medicamentos = ?,
      estado_insumos = ?,
      comentarios_insumos = ?
    WHERE id_solicitud = ?
  `;

  // Parámetros para el query
  const parametros = [
    material_adicional,
    material_externo,
    servicios,
    nombre_paquete,
    medicamentos,
    cantidad_adicional,
    cantidad_externo,
    cantidad_servicios,
    cantidad_paquete,
    cantidad_medicamento,
    disponibilidad_material_adicional,
    disponibilidad_material_externo,
    disponibilidad_servicios,
    disponibilidad_paquetes,
    disponibilidad_medicamentos,
    estado_insumos,
    comentarios_insumos,
    id
  ];

  // Ejecutar el query
  db.query(query, parametros, (err, results) => {
    if (err) {
      console.error('Error actualizando solicitud:', err);
      return res.status(500).json({ error: 'Error actualizando solicitud' });
    }

    res.json({
      message: 'Solicitud actualizada exitosamente',
      datos: {
        material_adicional,
        material_externo,
        servicios,
        nombre_paquete,
        medicamentos,
        cantidad_adicional,
        cantidad_externo,
        cantidad_servicios,
        cantidad_paquete,
        cantidad_medicamento,
        disponibilidad_material_adicional,
        disponibilidad_material_externo,
        disponibilidad_servicios,
        disponibilidad_paquetes,
        disponibilidad_medicamentos,
        estado_insumos,
        comentarios_insumos
      }
    });
  });
});

// Obtener una solicitud por ID
/* router.get('/solicitudes-insumos/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM solicitudes_cirugia WHERE id_solicitud = ?', [id], (err, results) => {
      if (err) {
          console.error('Error fetching solicitud by id:', err);
          res.status(500).json({ error: 'Error fetching solicitud by id' });
      } else if (results.length === 0) {
          res.status(404).json({ error: 'Solicitud not found' });
      } else {
          const solicitud = results[0];
          // Formatear las fechas para visualización
          res.setHeader('Content-Type', 'application/json');
          res.json(solicitud);
      }
  });
}); */


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
  const paquetesIds = req.body.paquetesIds; // Asumiendo que el cuerpo de la solicitud tiene una propiedad "paquetesIds" con un array de ids

  if (!paquetesIds || paquetesIds.length === 0) {
    return res.status(400).json({ message: 'Debes seleccionar al menos un paquete' });
  }

  // Consulta para obtener los nombres de los paquetes seleccionados
  const query = 'SELECT nombre FROM paquetes WHERE id_paquete IN (?)';
  db.query(query, [paquetesIds], (err, paquetesResults) => {
    if (err) {
      console.error('Error al obtener los nombres de los paquetes:', err);
      return res.status(500).json({ message: 'Error al obtener los nombres de los paquetes' });
    }

    const paquetesNombres = paquetesResults.map(p => p.nombre).join(', ');

    // Consulta para actualizar el insumo con los paquetes seleccionados
    const updateQuery = 'UPDATE insumos SET paquete = ? WHERE id_insumo = ?';
    db.query(updateQuery, [paquetesNombres, idInsumo], (err) => {
      if (err) {
        console.error('Error al asociar paquetes al insumo:', err);
        return res.status(500).json({ message: 'Error al asociar paquetes al insumo' });
      }

      res.status(200).json({ message: 'Paquetes asociados correctamente al insumo' });
    });
  });
});


router.delete('/paquetes/:idPaquete', (req, res) => {
  const { idPaquete } = req.params;
  
  const query = 'DELETE FROM paquetes WHERE id_paquete = ?';
  
  db.query(query, [idPaquete], (err, result) => {
    if (err) {
      console.error('Error al eliminar el paquete:', err);
      return res.status(500).json({ message: 'Error al eliminar el paquete' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Paquete no encontrado' });
    }
    
    res.status(200).json({ message: 'Paquete eliminado correctamente' });
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