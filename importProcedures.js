const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

const importInsumosToDB = async () => {
  try {
    // Lee el archivo Excel usando xlsx
    const workbook = xlsx.readFile('C:/Users/rober/OneDrive/Escritorio/artro.xlsx');
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
      // Extrae las columnas necesarias del archivo Excel y limpia los datos
      const nombre = row['Nombre del sistema'] ? row['Nombre del sistema'].trim() : null;
      const clave = row['Clave'] ? row['Clave'].trim() : null;
      const descripcion = row['Descripcion'] ? row['Descripcion'].trim() : null;

      // Inserta los datos en la tabla insumos con la especialidad fija en "Trauma y Ortopedia"
      await connection.execute(
        'INSERT INTO insumos (nombre, clave, descripcion, especialidad) VALUES (?, ?, ?, ?)',
        [nombre, clave, descripcion, 'Columna']
      );
    }

    console.log('Datos de insumos importados con éxito.');
    await connection.end();
  } catch (error) {
    console.error('Error importando datos:', error);
  }
};

importInsumosToDB();