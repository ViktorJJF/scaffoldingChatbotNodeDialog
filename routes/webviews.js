'use strict';

const config = require('../config');
const express = require('express');
const fbservice = require('../fb-service/fb-service');
const queries_user_estudiante = require('../queries_user_estudiante');
const { getUserName } = require('../utilities/utilities');

const router = express.Router();



//Se carga el webview con el formulario estudiante
router.get('/webview', function(req, res) {
    res.render('register-form');
});
//Se carga el webview con el formulario para foraneos a la U 
router.get('/webview-2', function(req, res) {
    res.render('register-form-foraneo');
});

router.get('/save', function(req, res) {
    let body = req.query;
    var datosRegistroEstudiantes = [];
    datosRegistroEstudiantes[0] = body.studentujcm;
    datosRegistroEstudiantes[1] = body.broadcast;
    datosRegistroEstudiantes[2] = body.psid;
    queries_user_estudiante.update_settings_users(function(callback) {
        getUserName(username => {
            if (body.broadcast == 1) fbservice.sendTextMessage(body.psid, `Felicidades ${username}, ya estás suscrit@! te estaré informando de futuros talleres u otros eventos.`);
            if (body.broadcast == 0) fbservice.sendTextMessage(body.psid, `parece que ya no quieres recibir noticias ${username}, puedes suscribirte después ☝`);
        }, body.psid);
    }, datosRegistroEstudiantes);
    console.log(res.sendStatus(200));

});

router.get('/settings', function(req, res) {

    queries_user_estudiante.list_users_by_id(function(result) {
        let settings = [];
        settings = result[0];
        res.json(settings);
    }, req.query.psid);
});

module.exports = router;