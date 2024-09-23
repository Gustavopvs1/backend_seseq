const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

const importExcelToDB = async () => {
  try {
    // Lee el archivo CSV usando xlsx
    const workbook = xlsx.readFile('D:/Descargas/personal.csv');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Configuración de la conexión a la base de datos
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345',
      database: 'seseq',
    });

    // Itera sobre los datos y realiza la inserción en la base de datos
    for (const row of data) {
      // Extraer columnas del CSV y limpiar espacios en los nombres
      const paterno = row.Paterno ? row.Paterno.trim() : '';
      const materno = row.Materno ? row.Materno.trim() : '';
      const nombre = row.Nombre ? row.Nombre.trim() : '';
      const codigo = row.Codigo ? row.Codigo.trim() : '';
      const puesto = row.Puesto ? row.Puesto.trim() : '';

      // Verifica que los campos de nombre estén presentes
      if (paterno && nombre) {
        // Cambia el orden a Paterno Materno Nombre
        const nombreCompleto = `${paterno} ${materno} ${nombre}`.trim();

        // Inserta los datos en la tabla personal
        await connection.execute(
          'INSERT INTO personal (nombre_completo, codigo, puesto) VALUES (?, ?, ?)',
          [nombreCompleto, codigo, puesto]
        );
      } else {
        console.log('Fila inválida omitida:', row);
      }
    }

    console.log('Datos del personal importados con éxito.');
    await connection.end();
  } catch (error) {
    console.error('Error importando datos:', error);
  }
};

importExcelToDB();
