'use strict';
const request = require('request');
const config = require('./config');
const pg = require('pg');
const moment = require('moment'); // Get date
pg.defaults.ssl = true;

module.exports = {

    //
    update_user_estudiante: function(callback, setting, userId) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    'UPDATE procedimiento_ad_pre SET newsletter=$1 WHERE fb_id=$2', [setting, userId],
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback(false);
                        } else {
                            callback(true);
                        };
                        done();
                    });

        });
        //pool.end();
    },

    //Read

    read_user_estudiante: function(callback, nombreRequisito) {
        var pool = new pg.Pool(config.PG_CONFIG);
        console.log('Se entro a requisitosTramites.js');
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    'SELECT requisito,costo FROM public.procedimiento_ad_pre WHERE nombre=$1', [nombreRequisito],
                    function(err, result) {
                        //
                        if (err) {
                            console.log(err);
                            callback('');
                        }
                        console.log('Se esta enviando: ', result.rows);
                        if (result.rows.length > 0) {
                            callback(result.rows);

                        } else {
                            callback('INDEFINIDO');
                        }

                        done();

                    });
            // assert(client.release === release)

        });

    },

    list_users_by_id: function(callback, psid) {
        var pool = new pg.Pool(config.PG_CONFIG);
        console.log('Se entro a list_user_estudiante');
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }

            client
                .query(
                    'SELECT newsletter,is_student FROM users WHERE fb_id=$1', [psid],
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

    //Insert user_estudiante
    insert_user_estudiante: function(callback, datosRegistroEstudiantes) {
        var pool = new pg.Pool(config.PG_CONFIG);
        console.log('Datos enviados a inser_user_estudiante: ', datosRegistroEstudiantes);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            var date = moment().format();
            //datosRegistroEstudiantes[6] aca esta llegando el fbID del usuario, si existe entonces hago update, sino insert
            // let sql1 = `SELECT fb_id FROM user_estudiante WHERE fb_id='${datosRegistroEstudiantes[6]}' LIMIT 1`;
            client
                .query(
                    'INSERT INTO user_estudiante (cod_estudiante,nombres,apellidos,dni,email,id_carrera,fec_registro,fb_id,newsletter)' +
                    'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [
                        datosRegistroEstudiantes[0],
                        datosRegistroEstudiantes[1],
                        datosRegistroEstudiantes[2],
                        datosRegistroEstudiantes[3],
                        datosRegistroEstudiantes[4],
                        datosRegistroEstudiantes[5],
                        date,
                        datosRegistroEstudiantes[6],
                        datosRegistroEstudiantes[7]
                    ],
                    function(err, result) {
                        if (err) {
                            console.log('Query error: ' + err);
                        } else {
                            callback([]);
                        };
                        done();
                    });



        });
        //pool.end();
    },

    update_settings_users: function(callback, datosRegistroEstudiantes) {
        console.log('esto llego: ', datosRegistroEstudiantes);
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    'UPDATE users SET is_student=$1,newsletter=$2 WHERE fb_id=$3', [datosRegistroEstudiantes[0],
                        datosRegistroEstudiantes[1],
                        datosRegistroEstudiantes[2]
                    ],
                    function(err, result) {
                        if (err) {
                            console.log('Algo salio mal :( :', err);
                            callback(false);
                        } else {
                            callback(true);
                            console.log('IMPORTANTE: ', datosRegistroEstudiantes);
                            console.log('updated users settings');
                        };
                        done();
                    });

        });
    },

    insert_update_user_estudiante: function(callback, datosRegistroEstudiantes) {
        var pool = new pg.Pool(config.PG_CONFIG);
        console.log('Datos enviados a insert_update_user_estudiante: ', datosRegistroEstudiantes);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            var date = moment().format();
            //datosRegistroEstudiantes[6] aca esta llegando el fbID del usuario, si existe entonces hago update, sino insert
            let sql1 = `SELECT fb_id FROM user_estudiante WHERE fb_id='${datosRegistroEstudiantes[6]}' LIMIT 1`;
            client
                .query(
                    sql1,
                    function(err, result) {
                        if (err) {
                            console.log('Query error: ' + err);
                        } else {
                            if (result.rows.length === 0) { //Si es que no hay resultados entonces hago insert
                                console.log('Se entro al caso insert');
                                let sql2 = 'INSERT INTO user_estudiante (cod_estudiante,nombres,apellidos,dni,email,id_carrera,fec_registro,fb_id,newsletter)' +
                                    'VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)';
                                client
                                    .query(
                                        sql2, [
                                            datosRegistroEstudiantes[0],
                                            datosRegistroEstudiantes[1],
                                            datosRegistroEstudiantes[2],
                                            datosRegistroEstudiantes[3],
                                            datosRegistroEstudiantes[4],
                                            datosRegistroEstudiantes[5],
                                            date,
                                            datosRegistroEstudiantes[6],
                                            datosRegistroEstudiantes[7]
                                        ], (err, result) => {
                                            if (err) {
                                                console.log('Query error: ', err);
                                            }
                                        }

                                    );
                            } else {
                                console.log('Se entro al caso update');
                                let sql3 = 'UPDATE user_estudiante SET cod_estudiante=$1,nombres=$2,apellidos=$3,dni=$4,email=$5,id_carrera=$6,newsletter=$7 where fb_id=$8';
                                client.query(sql3, [
                                    datosRegistroEstudiantes[0],
                                    datosRegistroEstudiantes[1],
                                    datosRegistroEstudiantes[2],
                                    datosRegistroEstudiantes[3],
                                    datosRegistroEstudiantes[4],
                                    datosRegistroEstudiantes[5],
                                    datosRegistroEstudiantes[7],
                                    datosRegistroEstudiantes[6]
                                ], (err, result) => {
                                    if (err) {
                                        console.log('Query error: ', err);
                                    }
                                });
                            }


                        };
                        callback([]);
                        done();
                    }

                );



        });
        //pool.end();
    }

}