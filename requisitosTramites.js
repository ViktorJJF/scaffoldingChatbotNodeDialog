'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
pg.defaults.ssl = true;

module.exports = {

    //
    actualizarTramitesPre: function(callback, data) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            let sql1 = 'UPDATE procedimiento_ad_pre SET nombre=$1,objetivo=$2,responsabilidad=$3,requisito=$4,duracion=$5,costo=$6,tipo_oficina_tramite=$7 where id_procedimiento_ad_pre=$8';
            client
                .query(sql1, [
                        data.nombre,
                        data.objetivo,
                        data.responsabilidad,
                        data.requisito,
                        data.duracion,
                        data.costo,
                        data.tipo_oficina_tramite,
                        data.id
                    ],
                    function(err, result) {
                        if (err) {
                            return console.log('Hubo un error: ' + err);
                        } else {
                            console.log('Actualizacion de ' + data.nombre + ' correcta');
                            callback([]);
                            done();
                        }


                    });

        });
        //pool.end();
    },

    //Read

    leerTramitesPre: function(callback, nombreRequisito) {
        var pool = new pg.Pool(config.PG_CONFIG);
        console.log('I am into leerTramitesPre from requisitosTramites.js');
        console.log('Recibi la palabra ' + nombreRequisito);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    'SELECT requisito,costo,tipo_oficina_tramite FROM public.procedimiento_ad_pre WHERE nombre=$1', [nombreRequisito],
                    function(err, result) {
                        //
                        if (err) {
                            console.log(err);
                            callback('');
                        }

                        if (result.rows.length > 0) {
                            callback(result.rows);

                        } else {
                            callback('INDEFINIDO');
                        }
                        //console.log('Se esta enviando: ', result.rows);

                        done();

                    });
            // assert(client.release === release)

        });

    },

    listadoTramites: function(callback) {
        var pool = new pg.Pool(config.PG_CONFIG);
        console.log('Se entro a listadoTramites');
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    'SELECT * FROM procedimiento_ad_pre ORDER BY NOMBRE ASC',
                    function(err, result) {
                        //
                        if (err) {
                            console.log(err);
                            callback([]);
                        }
                        console.log('Se esta enviando: ', result.rows);
                        callback(result.rows);
                        done();

                    });
            // assert(client.release === release)

        });

    },

    //Update
    insertarTramitesPre: function(callback, datosProcedimiento) {
        var pool = new pg.Pool(config.PG_CONFIG);
        console.log('Datos enviados a insertarTramite: ', datosProcedimiento);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    'INSERT INTO procedimiento_ad_pre (nombre,objetivo,responsabilidad,requisito,duracion,costo,tipo_oficina_tramite)' +
                    'VALUES ($1,$2,$3,$4,$5,$6,$7)', [
                        datosProcedimiento[0],
                        datosProcedimiento[1],
                        datosProcedimiento[2],
                        datosProcedimiento[3],
                        datosProcedimiento[4],
                        datosProcedimiento[5],
                        datosProcedimiento[6]
                    ],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback([]);
                        } else {
                            console.log('Inserción de ' + datosProcedimiento[0] + ' correcta');
                            callback([]);
                        };
                        done();
                    });

        });
        //pool.end();
    }
}