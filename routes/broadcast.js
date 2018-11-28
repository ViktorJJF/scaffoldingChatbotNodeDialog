const config = require('../config');
const express = require('express');
const userService = require('../user');
const requisitos = require('../requisitosTramites');
const router = express.Router();
const fbService = require('../fb-service/fb-service');
const queries_user_estudiante = require('../queries_user_estudiante');



// router.get('/registro-estudiante', function(req, res) {
//     //     //res.send('Hello world, I am a chat bot')
//     res.render('register-form.ejs');
//     //     res.sendFile(__dirname   +'/index.html');
// });

router.post('/', function(req, res) {
    res.send('Hola! este espacio será la futura Pagina Web de Mariateguino UJCM')
});


router.get('/dashboard', function(req, res) {
    requisitos.listadoTramites(function(listadoRequisitos) {
        req.session.listadoRequisitos = listadoRequisitos;
        res.render('dashboard', { listadoRequisitos: listadoRequisitos });
    });

});

router.get('/datos', function(req, res) {

    requisitos.listadoTramites(function(listadoRequisitos) {
        let datos = [];
        datos = listadoRequisitos;
        res.json(datos);
    });


});
router.post('/save', function(req, res) {

    requisitos.actualizarTramitesPre((callback) => {
        res.json({ DataActualizada: req.body });
    }, req.body);


});

router.post('/dashboard', function(req, res) {

    var datosProcedimiento = [];
    datosProcedimiento[0] = req.body.nombre;
    datosProcedimiento[1] = req.body.objetivo;
    datosProcedimiento[2] = req.body.responsabilidad;
    datosProcedimiento[3] = req.body.requisito;
    datosProcedimiento[4] = req.body.duracion;
    datosProcedimiento[5] = req.body.costo;
    datosProcedimiento[6] = req.body.tipo_oficina_tramite;
    requisitos.insertarTramitesPre((callback) => {
        res.json({ DataInsertada: req.body });
    }, datosProcedimiento);

});

router.get('/no-access', function(req, res) {
    res.render('no-access');
});

router.get('/broadcast', function(req, res) {
    res.render('broadcast');
});

router.post('/broadcast', function(req, res) {
    let message = req.body.message;
    //let newstype = parseInt(req.body.newstype, 10);
    //req.session.newstype = newstype;
    req.session.message = message;
    userService.readAllUsers(function(users) {
        req.session.users = users;
        res.render('broadcast-confirm', { user: req.user, message: message, users: users, numUsers: users.length })
    });


});

router.get('/broadcast-send', function(req, res) {
    let message = req.session.message;
    let allUsers = req.session.users;

    let sender;
    for (let i = 0; i < allUsers.length; i++) {
        sender = allUsers[i].fb_id;
        fbService.sendTextMessage(sender, message);
    }

    res.redirect('/broadcast-sent');
});

router.get('/broadcast-sent', function(req, res) {
    let newstype = req.session.newstype;
    let message = req.session.message;
    let users = req.session.users;

    req.session.newstype = null;
    req.session.message = null;
    req.session.users = null;
    //res.render('/broadcast-sent');
    res.render('broadcast-sent', { message: message, users: users, numUsers: users.length, newstype: newstype });
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        //if (req.user.id === config.ADMIN_ID ) {
        return next();
        // }
        // res.redirect('/broadcast/no-access');
    } else {
        res.redirect('/');
    }
}


module.exports = router;