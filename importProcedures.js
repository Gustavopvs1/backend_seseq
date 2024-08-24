const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

const importExcelToDB = async () => {
  try {
    // Usa la ruta absoluta directamente
    const workbook = xlsx.readFile('D:/Descargas/PROCEDIMIENTO_202402.xlsx');
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
      const catalogKey = row.CATALOG_KEY;
      const procedureName = row.PRO_NOMBRE;

      if (catalogKey && procedureName) {
        const nombreProcedimiento = `${procedureName} - ${catalogKey}`;

        await connection.execute(
          'INSERT INTO procedimientos (nombre_procedimiento) VALUES (?)',
          [nombreProcedimiento]
        );
      } else {
        console.log('Fila inválida omitida:', row);
      }
    }

    console.log('Procedimientos importados con éxito.');
    await connection.end();
  } catch (error) {
    console.error('Error importando procedimientos:', error);
  }
};

importExcelToDB();
