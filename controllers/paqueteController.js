const mysql = require('mysql2');
const db = require('../database/db');

class PaqueteController {
    constructor(db) {
        this.db = db;
    }

    // Inicializar paquete en solicitud
    inicializarPaquete(req, res) {
        const { solicitudId, paqueteId } = req.body;

        // Consulta para obtener insumos del paquete
        const insumosQuery = `
            SELECT 
                i.id AS id_insumo, 
                i.nombre, 
                pi.cantidad_default AS cantidad_original
            FROM insumos i
            JOIN paquete_insumos pi ON pi.insumo_id = i.id
            WHERE pi.paquete_id = ?
        `;

        this.db.query(insumosQuery, [paqueteId], (err, insumos) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Preparar insumos personalizados
            const insumosPersonalizados = insumos.map(insumo => ({
                id_insumo: insumo.id_insumo,
                nombre: insumo.nombre,
                cantidad_original: insumo.cantidad_original,
                cantidad_personalizada: insumo.cantidad_original,
                disponibilidad: 'disponible',
                eliminado: false
            }));

            // Obtener nombre del paquete
            const paqueteQuery = `SELECT nombre FROM paquetes WHERE id = ?`;
            
            this.db.query(paqueteQuery, [paqueteId], (err, paqueteResult) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Actualizar solicitud
                const updateQuery = `
                    UPDATE solicitudes_cirugia
                    SET 
                        paquete_original_id = ?,
                        nombre_paquete_original = ?,
                        insumos_personalizados = ?
                    WHERE id_solicitud = ?
                `;

                this.db.query(
                    updateQuery, 
                    [
                        paqueteId, 
                        paqueteResult[0].nombre,
                        JSON.stringify(insumosPersonalizados),
                        solicitudId
                    ], 
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ 
                            mensaje: 'Paquete inicializado correctamente',
                            insumos: insumosPersonalizados
                        });
                    }
                );
            });
        });
    }

    // Modificar insumo en paquete de solicitud
    modificarInsumosPaquete(req, res) {
        const { 
            solicitudId, 
            insumos // Array de insumos a modificar
        } = req.body;

        // Obtener insumos personalizados actuales
        const selectQuery = `
            SELECT insumos_personalizados 
            FROM solicitudes_cirugia 
            WHERE id_solicitud = ?
        `;

        this.db.query(selectQuery, [solicitudId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            let insumosPersonalizados = JSON.parse(result[0].insumos_personalizados);

            // Modificar insumos
            const insumosModificados = insumosPersonalizados.map(insumoOriginal => {
                const insumoModificado = insumos.find(i => i.id_insumo === insumoOriginal.id_insumo);
                
                if (insumoModificado) {
                    return {
                        ...insumoOriginal,
                        cantidad_personalizada: insumoModificado.cantidad ?? insumoOriginal.cantidad_personalizada,
                        disponibilidad: insumoModificado.disponibilidad ?? insumoOriginal.disponibilidad,
                        eliminado: insumoModificado.eliminado ?? insumoOriginal.eliminado
                    };
                }
                
                return insumoOriginal;
            });

            // Actualizar solicitud
            const updateQuery = `
                UPDATE solicitudes_cirugia
                SET insumos_personalizados = ?
                WHERE id_solicitud = ?
            `;

            this.db.query(
                updateQuery, 
                [
                    JSON.stringify(insumosModificados), 
                    solicitudId
                ], 
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ 
                        mensaje: 'Insumos modificados correctamente',
                        insumos: insumosModificados
                    });
                }
            );
        });
    }

    // Obtener insumos de paquete en solicitud
    obtenerInsumosPaquete(req, res) {
        const { solicitudId } = req.params;

        const query = `
            SELECT 
                COALESCE(
                    (SELECT insumos_personalizados 
                     FROM solicitudes_cirugia 
                     WHERE id_solicitud = ?),
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id_insumo', i.id,
                            'nombre', i.nombre,
                            'cantidad_original', pi.cantidad_default,
                            'cantidad_personalizada', pi.cantidad_default,
                            'disponibilidad', 'disponible',
                            'eliminado', false
                        )
                    )
                    FROM insumos i
                    JOIN paquete_insumos pi ON pi.insumo_id = i.id
                    JOIN solicitudes_cirugia sc ON sc.paquete_original_id = pi.paquete_id
                    WHERE sc.id_solicitud = ?)
                ) AS insumos
        `;

        this.db.query(query, [solicitudId, solicitudId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Parsear y filtrar insumos no eliminados
            const insumos = JSON.parse(result[0].insumos)
                .filter(insumo => !insumo.eliminado);

            res.json(insumos);
        });
    }
}

module.exports = PaqueteController;