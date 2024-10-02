// routes/pdf.js

const express = require('express');
const multer = require('multer');
const { convertAsync } = require('libreoffice-convert');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router(); // Usa router en vez de app para las rutas en Express
const upload = multer({ dest: 'uploads/' });

// Ruta para convertir el archivo DOCX a PDF
router.post('/convert-to-pdf', upload.single('docx'), async (req, res) => {
  try {
    const docxPath = req.file.path; // Ruta temporal del archivo DOCX subido
    const pdfPath = path.join('uploads', `${req.file.filename}.pdf`); // Ruta temporal del PDF generado

    const docxFile = await fs.readFile(docxPath); // Lee el archivo DOCX
    const pdfFile = await convertAsync(docxFile, '.pdf', undefined); // Convierte el DOCX a PDF
    
    await fs.writeFile(pdfPath, pdfFile); // Guarda el PDF en la ruta temporal

    // Envía el PDF al cliente y luego limpia los archivos temporales
    res.sendFile(pdfPath, async (err) => {
      if (err) {
        console.error('Error enviando el archivo:', err);
      }
      // Borra los archivos temporales una vez enviados
      await fs.unlink(docxPath);
      await fs.unlink(pdfPath);
    });
  } catch (error) {
    console.error('Error al convertir el archivo:', error);
    res.status(500).send('Error en la conversión del archivo');
  }
});

module.exports = router;
