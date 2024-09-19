const express = require('express'); // Importa el módulo express para crear el router y manejar las rutas
const router = express.Router(); // Crea un enrutador de express para manejar las rutas relacionadas con las solicitudes de cirugía
const db = require('../database/db');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const { convertWordToPdf } = require('./utils/wordToPdfConverter');


router.post('/generar-pdf/:id', async (req, res) => {
    try {
      const appointmentId = req.params.id;
      
      // Obtener los datos de la solicitud de la base de datos
      const appointmentData = await YourModel.findById(appointmentId);
      
      // Leer la plantilla
      const content = fs.readFileSync(path.resolve(__dirname, 'plantillas', 'solicitud_quirofano.docx'), 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  
      // Mapear los datos a la plantilla
      doc.setData({
        folio: appointmentData.folio,
        tel_contacto: appointmentData.tel_contacto,
        ap_paterno: appointmentData.ap_paterno,
        ap_materno: appointmentData.ap_materno,
        nombre_paciente: appointmentData.nombre_paciente,
        sexo: appointmentData.sexo,
        tipo_admision: appointmentData.tipo_admision,
        tipo_intervencion: appointmentData.tipo_intervencion,
        nombre_especialidad: appointmentData.nombre_especialidad,
        fecha_solicitada: appointmentData.fecha_solicitada,
        hora_solicitada: appointmentData.hora_solicitada,
        tiempo_estimado: appointmentData.tiempo_estimado,
        turno_solicitado: appointmentData.turno_solicitado,
        sala_quirofano: appointmentData.sala_quirofano,
        procedimientos_paciente: appointmentData.procedimientos_paciente,
        nombre_cirujano: appointmentData.nombre_cirujano,
        req_insumo: appointmentData.req_insumo
      });
  
      // Generar el documento
      doc.render();
      const buf = doc.getZip().generate({ type: 'nodebuffer' });
  
      // Guardar el archivo temporalmente
      const tempFilePath = path.join(__dirname, 'temp', `solicitud_${appointmentId}.docx`);
      fs.writeFileSync(tempFilePath, buf);
  
      // Convertir a PDF
      const pdfBuffer = await convertWordToPdf(tempFilePath);
  
      // Eliminar el archivo temporal
      fs.unlinkSync(tempFilePath);
  
      // Enviar el PDF como respuesta
      res.contentType('application/pdf');
      res.send(pdfBuffer);
  
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      res.status(500).send('Error al generar el PDF');
    }
  });
  
  module.exports = router;