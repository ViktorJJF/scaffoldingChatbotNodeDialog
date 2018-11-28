'use strict';
const request = require('request');
const config = require('./config');
const moment = require('moment');
const pg = require('pg');
pg.defaults.ssl = true;

module.exports = {

    addUser: function(callback, userId) {
        request({
            uri: 'https://graph.facebook.com/v2.7/' + userId,
            qs: {
                access_token: config.FB_PAGE_TOKEN
            }

        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {

                var user = JSON.parse(body);
                console.log('Se entro a addUser de user.js');
                if (user.first_name.length > 0) {

                    var pool = new pg.Pool(config.PG_CONFIG);
                    pool.connect(function(err, client, done) {
                        if (err) {
                            return console.error('Error acquiring client', err.stack);
                        }
                        var rows = [];
                        var date = moment().format();
                        let sql1 = `SELECT id FROM users WHERE fb_id='${userId}' LIMIT 1`;
                        client
                            .query(sql1,

                                function(err, result) {
                                    // done();
                                    if (err) {
                                        console.log('Query error: ' + err);

                                    } else {
                                        console.log('rows: ' + result.rows.length);
                                        if (result.rows.length === 0) {
                                            let sql = 'INSERT INTO users (fb_id, first_name, last_name, profile_pic, ' +
                                                'fec_registro) VALUES ($1, $2, $3, $4, $5)';
                                            console.log('email: ' + user.email);
                                            client.query(sql, [
                                                userId,
                                                user.first_name,
                                                user.last_name,
                                                user.profile_pic,
                                                date

                                            ]);
                                        }
                                    }

                                });


                        callback(user);
                        done();

                    });
                    // pool.end(function (err) {
                    //      if (err) throw err;

                    //     process.exit();
                    ///  });
                } else {
                    console.log("Cannot get data for fb user with id",
                        userId);
                }
            } else {
                console.error(response.error);
            }

        });
    },

    readAllUsers: function(callback) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            console.log('Se entro a readAllUsers de user.js');
            client
                .query(
                    'SELECT fb_id, first_name, last_name FROM users WHERE newsletter=1',
                    function(err, result) {
                        if (err) {
                            console.log(err);
                            callback([]);
                        } else {
                            console.log('rows');
                            console.log(result.rows);
                            callback(result.rows);
                        };
                        done();
                    });

        });
        //pool.end();
    },

    newsletterSettings: function(callback, setting, userId) {
        var pool = new pg.Pool(config.PG_CONFIG);
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            console.log('Se entro a newsletterSettings de user.js');
            client
                .query(
                    'UPDATE users SET newsletter=$1 WHERE fb_id=$2', [setting, userId],
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
    }

}