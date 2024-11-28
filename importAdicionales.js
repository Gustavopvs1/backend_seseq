const xlsx = require('xlsx');
const mysql = require('mysql2/promise');

const importMaterialAdicionalToDB = async () => {
  try {
    // Lee el archivo Excel usando xlsx
    const workbook = xlsx.readFile('D:/Descargas/1 Material Adicional.xlsx');
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
      const clave = row['Clave'] ? row['Clave'].trim() : '';
      const descripcion = row['Descripcion'] ? row['Descripcion'].trim() : '';

      // Verifica que los campos clave y descripcion estén presentes antes de insertar
      if (clave && descripcion) {
        await connection.execute(
          'INSERT INTO material_adicional (clave, descripcion) VALUES (?, ?)',
          [clave, descripcion]
        );
      } else {
        console.log('Fila inválida omitida:', row);
      }
    }

    console.log('Datos de material adicional importados con éxito.');
    await connection.end();
  } catch (error) {
    console.error('Error importando datos:', error);
  }
};

importMaterialAdicionalToDB();
