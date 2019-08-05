'use strict';
const request = require('request');
const config = require('../config');
const moment = require('moment');
const pg = require('pg');
pg.defaults.ssl = true;

module.exports = {
    getMovie: (callback, movieToFind) => {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            client
                .query(
                    `select * from movies where name='${movieToFind}'`,
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback(null);
                        } else {
                            console.log("respuesta de la pelicula");
                            console.log('rows');
                            console.log(result.rows);
                            callback(result.rows);
                        };
                        done();
                    });

        });
        //pool.end();
    },

}