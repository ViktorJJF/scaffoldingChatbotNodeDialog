'use strict';
const apiai = require('apiai');
const config = require('./config');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const pg = require('pg');
const app = express();
const uuid = require('uuid');
const userService = require('./user');
const colors = require('./colors');
const requisitos = require('./requisitosTramites');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const broadcast = require('./routes/broadcast');
const webviews = require('./routes/webviews');
const levenshtain = require('./Algorithms/Levenshtein');


pg.defaults.ssl = true;



// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN');
}
if (!config.FB_VERIFY_TOKEN) {
    throw new Error('missing FB_VERIFY_TOKEN');
}
if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
    throw new Error('missing API_AI_CLIENT_ACCESS_TOKEN');
}
if (!config.FB_APP_SECRET) {
    throw new Error('missing FB_APP_SECRET');
}
if (!config.SERVER_URL) { //used for ink to static files
    throw new Error('missing SERVER_URL');
}
if (!config.SENDGRID_API_KEY) { //used for sending email
    throw new Error('missing SENDGRID_API_KEY');
}
if (!config.EMAIL_FROM) { //used for sending email
    throw new Error('missing EMAIL_FROML');
}
if (!config.EMAIL_TO) { //used for sending email
    throw new Error('missing EMAIL_TO');
}
if (!config.PG_CONFIG) { //postgresql config object
    throw new Error('missing PG_CONFIG');
}

//================================================================
//====================VIKTOR-UJCM=======================
//================================================================

//Keep bot awake
// const https = require("https");
// setInterval(function() {
//     https.get("https://smart-ujcm.herokuapp.com");
//     console.log('Keeping viktor UJCM awake');
// }, 300000); // every 5 minutes (300000)


app.set('port', (process.env.PORT || 5000))

//app.set('view engine','ejs');

// //Invoco a la pagina
// app.get('/',function(req,res){
// 	res.render('login');
// })

//verify request came from facebook
app.use(bodyParser.json({
    verify: verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// Process application/json
app.use(bodyParser.json())

//Autenticacion de facebook

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitilized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(profile, cb) {
    cb(null, profile);
});

passport.deserializeUser(function(profile, cb) {
    cb(null, profile);
});


app.set('view engine', 'ejs');


app.use('/', broadcast);
app.use('/webviews', webviews);
// Index route
app.get('/', function(req, res) {
    res.send('Hola! este espacio será la futura Pagina Web de Mariateguino UJCM')
});




//Configurando acceso a facebook y apiAi
const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {
    language: "en",
    requestSource: "fb"
});
const sessionIds = new Map();
const usersMap = new Map();


// for Facebook verification
app.get('/webhook/', function(req, res) {
    console.log("request");
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook/', function(req, res) {
    var data = req.body;
    console.log(JSON.stringify(data));



    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
                if (messagingEvent.optin) {
                    receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                } else if (messagingEvent.read) {
                    receivedMessageRead(messagingEvent);
                } else if (messagingEvent.account_linking) {
                    receivedAccountLink(messagingEvent);
                } else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        // Assume all went well.
        // You must send back a 200, within 20 seconds
        res.sendStatus(200);
    }
});



function setSessionAndUser(senderID) {
    console.log('Se entro a set SessionAndUser');
    if (!sessionIds.has(senderID)) {
        sessionIds.set(senderID, uuid.v1());
    }

    if (!usersMap.has(senderID)) {
        userService.addUser(function(user) {
            usersMap.set(senderID, user);
        }, senderID);
    }
}

function receivedMessage(event) {



    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    setSessionAndUser(senderID);

    //console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    //console.log(JSON.stringify(message));

    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;

    if (isEcho) {
        handleEcho(messageId, appId, metadata);
        return;
    } else if (quickReply) {
        console.log('Esto se considera quic_reply: ', quickReply)
        handleQuickReply(senderID, quickReply, messageId);
        return;
    }


    if (messageText) {
        //send message to api.ai
        console.log('Se paso por receivedMessage');
        sendToApiAi(senderID, messageText);

    } else if (messageAttachments) {
        handleMessageAttachments(messageAttachments, senderID);
    }
}


function handleMessageAttachments(messageAttachments, senderID) {
    //for now just reply
    sendTextMessage(senderID, "Archivo Recibido. Gracias !!.");
}

function handleQuickReply(senderID, quickReply, messageId) {
    var quickReplyPayload = quickReply.payload;
    switch (quickReplyPayload) {
        //Broadcast para despues
        // case 'EVENTOS_UNO_X_SEMANA':
        // 	userService.newsletterSettings(function(updated){
        // 		if(updated){
        // 			sendTextMessage(senderID,"Gracias por suscribirte :D" +
        // 			"Si ya no quieres estar suscrito solo escribe : 'darse de baja'");
        // 		} else {
        // 			sendTextMessage(senderID,"De momento el servicio esta inhabilitado, intenta mas tarde 😓");

        // 		}
        // 	},1,senderID);
        // break;
        // case 'EVENTOS_UNO_X_DIA':
        // userService.newsletterSettings(function(updated){
        // 	if(updated){
        // 			sendTextMessage(senderID,"Gracias por suscribirte :D" +
        // 			"Si ya no quieres estar suscrito solo escribe : 'darse de baja'");
        // 		} else {
        // 			sendTextMessage(senderID,"De momento el servicio esta inhabilitado, intenta mas tarde 😓");

        // 		}
        // 	},2,senderID);
        // 	break;
        default: sendToApiAi(senderID, quickReplyPayload);
        break;
    }
    console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
    //send payload to api.ai

}

//https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
function handleEcho(messageId, appId, metadata) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
}

function handleApiAiAction(sender, action, responseText, contexts, parameters) {
    console.log('Se entro a handleApiAiAction:');
    switch (action) {
        //Futura implementacion broadcast cuando se apruebe el bot
        // case "unsubscribe":
        // userService.newsletterSettings(function(updated){
        // 	if(updated){
        // 		sendTextMessage(sender,"Ya no estas suscrito, puedes activar esta opcion despues");

        // 	} else {
        // 		sendTextMessage(sender,"De momento el servicio esta inhabilitado, intenta mas tarde 😓");

        // 	}
        // },0,sender);

        // break;
        case "bot-clima":
            const weather = require('./bot-clima/bot-clima');

            weather.getWeather(responseText)
                .then(clima => {
                    sendTextMessage(sender, `El clima en ${responseText} es ${clima}℃`);
                    (sendTextMessage(sender, `Créditos a OpenWeatherMap 🤗 sabe todo del clima`));

                })
                .catch(() => {
                    sendTextMessage(sender, 'No encontre el clima para esa ubicacion');
                });

            break;
        case "req-tramites":
            let maxPercentWord;
            levenshtain.applyLevenshtein(responseText, (res) => {
                maxPercentWord = res;
            });
            if (!isDefined(contexts[0]) || contexts[0].name != 'req-tramites_dialog_params_requisitos') {
                console.log(`Palabra mandada: ${responseText}`);
                requisitos.leerTramitesPre((requisitos) => {
                    if (requisitos == 'INDEFINIDO') {
                        sendTextMessage(sender, 'No encontré información sobre ese trámite 🤐 capaz no escribiste su nombre correctamente'); //Por si no se encontro en la BD			
                    } else {
                        if (maxPercentWord == 'Grado de Bachiller') {
                            var msgBach;
                            msgBach = 'parece que quieres tramitar tu grado de bachiller, \n¿ingresaste a la UJCM antes de julio del 2014?';
                            let replies_bachiller = [{
                                    "content_type": "text",
                                    "title": "Sí, ingresé antes",
                                    "payload": "si_bachiller"
                                },
                                {
                                    "content_type": "text",
                                    "title": "No, ingresé después",
                                    "payload": "no_bachiller"
                                }

                            ];
                            return setTimeout(() => sendQuickReply(sender, msgBach, replies_bachiller), 1500);
                        }
                        let requisito = requisitos;
                        let reply = [];
                        reply[0] = 'Estos son los requisitos que encontré para ' + maxPercentWord + ' 😉 \n' + requisito[0].requisito;
                        reply[0] = reply[0].replace(/\\n/g, '\n');
                        reply[1] = 'recuerda también que ya puedes hacer tus trámites en línea 😀';

                        // reply[1] = 'El costo para este trámite es: ' + requisito[0].costo;
                        // reply[2] = 'Tambien puedes ver el manual de procedimientos ' +
                        //    '😀 https://drive.google.com/file/d/18RHP8zLFeKi1T2q-dWYFunv72mAI0RHw/view?usp=sharing';

                        sendTextMessage(sender, reply[0]);
                        setTimeout(() => sendTextMessage(sender, reply[1]), 500);
                        switch (requisito[0].tipo_oficina_tramite) {
                            case 0: // Tramites que no figuran en el sistema Tramite en linea
                                reply[2] = `Este trámite lo tienes que hacer personalmente 😅`;
                                setTimeout(() => sendTextMessage(sender, reply[2]), 1000);
                                break;
                            case 1: // Tramites Escuela
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_escuela = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_escuela"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_escuela), 1500);
                                break;
                            case 2: // Tramites Economia 
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_economia = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_economia"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_economia), 1500);
                                break;
                            case 3: // Tramites servicios academicos
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_servicios_academicos = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_servicio_academico"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_servicios_academicos), 1500);
                                break;
                            case 4: // Tramites bienestar
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_bienestar = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_bienestar"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_bienestar), 1500);
                                break;
                        }


                    }

                }, maxPercentWord)

            } else {
                sendTextMessage(sender, responseText); //Para que pida requisitos
            }
            break;
        case "req-tramites-with-entity": // Without Levenshtain
            if (!isDefined(contexts[0]) || contexts[0].name != 'req-tramites-with-entity_dialog_params_requisitos') {
                console.log(`Palabra mandada: ${responseText}`);
                requisitos.leerTramitesPre(function(requisitos) {
                    if (requisitos == 'INDEFINIDO') {
                        sendTextMessage(sender, 'Ups, no encontré información sobre ese trámite 🤐 capaz no escribiste su nombre correctamente'); //Por si no se encontro en la BD			
                    } else {
                        if (responseText == 'Grado de Bachiller') {
                            var msgBach;
                            msgBach = 'parece que quieres tramitar tu grado de bachiller, \n¿ingresaste a la UJCM antes de marzo del 2014?';
                            let replies_bachiller = [{
                                    "content_type": "text",
                                    "title": "Sí, ingresé antes",
                                    "payload": "si_bachiller"
                                },
                                {
                                    "content_type": "text",
                                    "title": "No, ingresé después",
                                    "payload": "no_bachiller"
                                }

                            ];
                            return setTimeout(() => sendQuickReply(sender, msgBach, replies_bachiller), 1500);
                        }
                        let requisito = requisitos;
                        let reply = [];
                        reply[0] = 'Estos son los requisitos que encontré para ' + responseText + ' 😉 \n' + requisito[0].requisito;
                        reply[0] = reply[0].replace(/\\n/g, '\n');
                        reply[1] = 'recuerda también que ya puedes hacer tus trámites en línea 😀';
                        sendTextMessage(sender, reply[0]);
                        setTimeout(() => sendTextMessage(sender, reply[1]), 500);
                        switch (requisito[0].tipo_oficina_tramite) {
                            case 0: // Tramites que no figuran en el sistema Tramite en linea
                                reply[2] = `Este trámite lo tienes que hacer personalmente 😅`;
                                setTimeout(() => sendTextMessage(sender, reply[2]), 1000);
                                break;
                            case 1: // Tramites Escuela
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_escuela = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_escuela"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_escuela), 1500);
                                break;
                            case 2: // Tramites Economia 
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_economia = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_economia"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_economia), 1500);
                                break;
                            case 3: // Tramites servicios academicos
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_servicios_academicos = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_servicio_academico"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_servicios_academicos), 1500);
                                break;
                            case 4: // Tramites bienestar
                                reply[2] = `¿Quieres hacer este trámite ahora?`;
                                let replies_bienestar = [{
                                        "content_type": "text",
                                        "title": "Sí",
                                        "payload": "si_tramite_bienestar"
                                    },
                                    {
                                        "content_type": "text",
                                        "title": "No",
                                        "payload": "no_tramite"
                                    }

                                ];
                                setTimeout(() => sendQuickReply(sender, reply[2], replies_bienestar), 1500);
                                break;
                        }
                    }

                }, responseText)

            } else {
                sendTextMessage(sender, responseText); //Para que pida requisitos
            }
            break;
            // case "iphone_colors":
            // 	colors.readAllColors(function(allColors){
            // 		let allColorsString=allColors.join(', ');
            // 		let reply=`Iphone 8 is avaliable in ${allColorsString} . What is your favorite color?`;
            // 		sendTextMessage(sender,reply);
            // 	})

            // break;

        case "detailed-application":
            console.log('Tu nombre es : ', contexts[0].parameters['user-name']);
            console.log('Tu celular es : ', contexts[0].parameters['phone-dash-number']);
            console.log('Tu puesto es : ', contexts[0].parameters['job-vacancy']);
            console.log(isDefined(contexts[0]));
            console.log('El contexto es:', contexts[0].name);
            console.log(contexts[0].parameter);
            //sendEmail('Hola! estoy probando sengrid','Que tal :V');
            if (isDefined(contexts[0]) &&
                (contexts[0].name == 'job_aplication' || contexts[0].name == 'job-application-details_dialog_context')) {
                let phone_number = (isDefined(contexts[0].parameters['phone-dash-number']) &&
                    contexts[0].parameters['phone-dash-number'] != '') ? contexts[0].parameters['phone-dash-number'] : '';
                console.log('phone_number = ', phone_number);
                let user_name = (isDefined(contexts[0].parameters['user-name']) &&
                    contexts[0].parameters['user-name'] != '') ? contexts[0].parameters['user-name'] : '';
                console.log('user_name = ', user_name);
                let previous_job = (isDefined(contexts[0].parameters['previus-job']) &&
                    contexts[0].parameters['previus-job'] != '') ? contexts[0].parameters['previus-job'] : '';
                console.log('previous_job = ', previous_job);
                let years_of_experience = (isDefined(contexts[0].parameters['years-of-experience']) &&
                    contexts[0].parameters['years-of-experience'] != '') ? contexts[0].parameters['years-of-experience'] : '';
                console.log('years_of_experience = ', years_of_experience);
                let job_vacancy = (isDefined(contexts[0].parameters['job-vacancy']) &&
                    contexts[0].parameters['job-vacancy'] != '') ? contexts[0].parameters['job-vacancy'] : '';
                console.log('job_vacancy = ', job_vacancy);

                if (phone_number == '' && user_name != '' && previous_job != '' && years_of_experience == '') {
                    let replies = [{
                            "content_type": "text",
                            "title": "Less than 1 year",
                            "payload": "Less than 1 year"
                        },
                        {
                            "content_type": "text",
                            "title": "Less than 10 years ",
                            "payload": "Less than 10 years"
                        },
                        {
                            "content_type": "text",
                            "title": "More than 10 years",
                            "payload": "More than 10 years"
                        }

                    ];
                    sendQuickReply(sender, responseText, replies);

                } else if (phone_number != '' && user_name != '' && previous_job != '' && years_of_experience != '' && job_vacancy != '') {
                    let emailContent = 'A new job enquiery from ' + user_name + ' for the job: ' + job_vacancy +
                        '<br> Previous job position: ' + previous_job + '.' +
                        '<br> Years of experience:' + years_of_experience + '.' +
                        '<br> Phone number: ' + phone_number + '.';
                    console.log('Esto funciona de maravilla!2');
                    sendEmail('New Job application (testeando)', emailContent);
                    sendTextMessage(sender, responseText);
                } else {
                    sendTextMessage(sender, responseText);
                }
            }

            break;
        case "job-enquiry":
            let replies = [{
                    "content_type": "text",
                    "title": "Accountant",
                    "payload": "Accountant"
                },
                {
                    "content_type": "text",
                    "title": "Sales",
                    "payload": "Sales"
                },
                {
                    "content_type": "text",
                    "title": "Not interested",
                    "payload": "Not interested"
                }

            ];

            sendQuickReply(sender, responseText, replies);
            break;
        default:
            //unhandled action, just send back the text
            console.log('Se activo sendTextMessage case default de handleAction');
            sendTextMessage(sender, responseText);
    }
}

function handleMessage(message, sender) {
    switch (message.type) {
        case 0: //text
            console.log('se entro a handleMessage case 0');
            sendTextMessage(sender, message.speech);
            break;
        case 2: //quick replies
            console.log('se entro a handleMessage case 2');
            let replies = [];
            for (var b = 0; b < message.replies.length; b++) {
                let reply = {
                    "content_type": "text",
                    "title": message.replies[b],
                    "payload": message.replies[b]
                }
                replies.push(reply);
            }
            console.log('Enviar al usuario titulo quick reply: ', message.title);
            console.log('Enviar al usuario replies: ', replies);
            sendQuickReply(sender, message.title, replies);
            break;
        case 3: //image
            console.log('se entro a handleMessage case 3');
            console.log('Enviando imagen con url: ', message.imageUrl);
            sendImageMessage(sender, message.imageUrl);
            break;
        case 4:
            // custom payload
            console.log('se entro a handleMessage case 4');

            var messageData = {
                recipient: {
                    id: sender
                },
                message: message.payload.facebook

            };
            console.log('Enviando al usuario messageData: ', message.payload.facebook);
            callSendAPI(messageData);

            break;
    }
}


function handleCardMessages(messages, sender) {

    let elements = [];
    for (var m = 0; m < messages.length; m++) {
        let message = messages[m];
        let buttons = [];
        for (var b = 0; b < message.buttons.length; b++) {
            let isLink = (message.buttons[b].postback.substring(0, 4) === 'http');
            let button;
            if (isLink) {
                button = {
                    "type": "web_url",
                    "title": message.buttons[b].text,
                    "url": message.buttons[b].postback
                }
            } else {
                button = {
                    "type": "postback",
                    "title": message.buttons[b].text,
                    "payload": message.buttons[b].postback
                }
            }
            buttons.push(button);
        }


        let element = {
            "title": message.title,
            "image_url": message.imageUrl,
            "subtitle": message.subtitle,
            "buttons": buttons
        };
        elements.push(element);
    }
    sendGenericMessage(sender, elements);
}


function handleApiAiResponse(sender, response) {
    let responseText = response.result.fulfillment.speech;
    let responseData = response.result.fulfillment.data;
    let messages = response.result.fulfillment.messages;
    let action = response.result.action;
    let contexts = response.result.contexts;
    let parameters = response.result.parameters;

    console.log('Se paso por handleApiAiResposnse');
    //console.log('messages.length = ',messages.length);	

    sendTypingOff(sender);

    if (isDefined(messages) && (messages.length == 1 && messages[0].type != 0 || messages.length > 1)) {
        let timeoutInterval = 1100;
        let previousType;
        let cardTypes = [];
        let timeout = 0;
        console.log('Probando bucle!');

        for (var i = 0; i < messages.length; i++) {

            if (previousType == 1 && (messages[i].type != 1 || i == messages.length - 1)) {

                timeout = (i - 1) * timeoutInterval;
                setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
                cardTypes = [];
                timeout = i * timeoutInterval;
                setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
            } else if (messages[i].type == 1 && i == messages.length - 1) {
                cardTypes.push(messages[i]);
                timeout = (i - 1) * timeoutInterval;
                setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
                cardTypes = [];
            } else if (messages[i].type == 1) {
                cardTypes.push(messages[i]);
            } else {
                timeout = i * timeoutInterval;
                setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
            }

            previousType = messages[i].type;

        }
    } else if (responseText == '' && !isDefined(action)) {
        //api ai could not evaluate input.
        console.log('Unknown query ' + response.result.resolvedQuery);
        sendTextMessage(sender, "I'm not sure what you want. Can you be more specific? esto es fallback de api.ai");
    } else if (isDefined(action)) {
        console.log('El response text del action es : ', responseText);
        handleApiAiAction(sender, action, responseText, contexts, parameters);
    } else if (isDefined(responseData) && isDefined(responseData.facebook)) {
        try {
            console.log('Response as formatted message' + responseData.facebook);
            sendTextMessage(sender, responseData.facebook);
        } catch (err) {
            sendTextMessage(sender, err.message);
        }
    } else if (isDefined(responseText)) {
        console.log('Mensaje Simple enviado');
        //var respuesta=responseText;
        responseText = responseText.replace(/\\n/g, '\n');
        sendTextMessage(sender, responseText);
    }
}

function sendToApiAi(sender, text) {
    console.log("sendToApiAi: " + text);
    sendTypingOn(sender);
    let apiaiRequest = apiAiService.textRequest(text, {
        sessionId: sessionIds.get(sender)
    });

    apiaiRequest.on('response', (response) => {
        if (isDefined(response.result)) {
            handleApiAiResponse(sender, response);
        }
    });

    apiaiRequest.on('error', (error) => console.error(error));
    apiaiRequest.end();
}




function sendTextMessage(recipientId, text) {
    console.log('se activo sendTextMessage');
    //console.log('El mensaje para el usuario es: ',text);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text
        }
    }
    console.log('El mensaje para el usuario es: ', messageData);
    callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId, imageUrl) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: imageUrl
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: config.SERVER_URL + "/assets/instagram_logo.gif"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "audio",
                payload: {
                    url: config.SERVER_URL + "/assets/sample.mp3"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example videoName: "/assets/allofus480.mov"
 */
function sendVideoMessage(recipientId, videoName) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: {
                    url: config.SERVER_URL + videoName
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example fileName: fileName"/assets/test.txt"
 */
function sendFileMessage(recipientId, fileName) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    url: config.SERVER_URL + fileName
                }
            }
        }
    };

    callSendAPI(messageData);
}



/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId, text, buttons) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: text,
                    buttons: buttons
                }
            }
        }
    };

    callSendAPI(messageData);
}


function sendGenericMessage(recipientId, elements) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: elements
                }
            }
        }
    };

    callSendAPI(messageData);
}


function sendReceiptMessage(recipientId, recipient_name, currency, payment_method,
    timestamp, elements, address, summary, adjustments) {
    // Generate a random receipt ID as the API requires a unique ID
    var receiptId = "order" + Math.floor(Math.random() * 1000);

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "receipt",
                    recipient_name: recipient_name,
                    order_number: receiptId,
                    currency: currency,
                    payment_method: payment_method,
                    timestamp: timestamp,
                    elements: elements,
                    address: address,
                    summary: summary,
                    adjustments: adjustments
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId, text, replies, metadata) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text,
            metadata: isDefined(metadata) ? metadata : '',
            quick_replies: replies
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };

    callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {


    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {


    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_off"
    };

    callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Welcome. Link your account.",
                    buttons: [{
                        type: "account_link",
                        url: config.SERVER_URL + "/authorize"
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}


function greetUserText(callback, userId) {
    // //first read user firstname
    // console.log('Se entro a greetUserText con id: ',userId);
    // userService.addUser(function(user){
    // 	sendTextMessage(userId,'Que tal ' + user.first_name + ' 😛 '+'soy Smart de la UJCM! 😀😀 '+
    // 	'puedo responder las dudas que tengas pero primero necesito que aceptes estos términos y condiciones 😏');
    // }, userId);
    // //let user=usersMap.get(userId);


    // callback(userId);	
}



/*
 * Call the Send API. The message data go	es in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
    //messageData.text=messageData.text.replace(/\\n/,'\n');
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: config.FB_PAGE_TOKEN
        },
        method: 'POST',
        json: messageData


    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log('se paso por callSendAPI');

            if (messageId) {
                console.log("Successfully sent message with id %s to recipient %s",
                    messageId, recipientId);
            } else {
                console.log("Successfully called Send API for recipient %s",
                    recipientId);
            }
        } else {
            console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
        }
    });
}

function suscribirseEventosUJCM(userId) {
    let responceText = "Puedo envitarte noticias sobre los últimos eventos de la UJCM Filial Tacna :D " +
        "¿Qué tan seguido te gustaría recibir esas noticias?";
    let replies = [{
            "content_type": "text",
            "title": "Una vez a la semana",
            "payload": "EVENTOS_UNO_X_SEMANA"
        },
        {
            "content_type": "text",
            "title": "Una vez por dia",
            "payload": "EVENTOS_UNO_X_DIA"
        }
    ];

    sendQuickReply(userId, responceText, replies);
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    setSessionAndUser(senderID);
    // The 'payload' param is a developer-defined field which is set in a postback 
    // button for Structured Messages. 
    var payload = event.postback.payload;

    switch (payload) {
        //case 'EVENTOS_UJCM':
        //	suscribirseEventosUJCM(senderID);

        //	break;
        //persistent menu
        case 'options_payload':
            sendToApiAi(senderID, "Ver Opciones");
            break;
        case '<GET_STARTED_PAYLOAD>':
            console.log('Se entro a GET_STARTED fuera de callback: ', senderID);
            // greetUserText(function(userID){
            // 	console.log('Se entro a GET_STARTED: ',senderID);
            // 	console.log('Se entro a GET_STARTED user ID: ',userID);
            // 	sendToApiAi(userID,"Empezar");
            // 	setTimeout()
            // },senderID);
            sendToApiAi(senderID, "Empezar");

            break;
            //Menu de Acciones Principales
            //Information
        case 'schedule_payload':
            sendToApiAi(senderID, 'schedule_payload');
            break;
        case 'address_payload':
            sendToApiAi(senderID, 'Direcciones');
            break;
        case 'telephone_payload':
            sendToApiAi(senderID, 'numero de telefono');
            break;
            //Procedures
        case 'manual_procedimientos_pre_payload':
            sendToApiAi(senderID, 'manual_procedimientos_pre_payload');
            break;
        case 'seguimiento_tramites_pre_payload':
            sendToApiAi(senderID, 'seguimiento_tramites_pre_payload');
            break;
        case 'requisitos_tramites_pre_payload':
            sendToApiAi(senderID, 'requisitos_tramites_pre_payload');
            break;

            //admissions
        case 'postular_admision__payload':
            sendToApiAi(senderID, 'postular_admision__payload');
            break;
        case 'fechas_admision_payload':
            sendToApiAi(senderID, 'fechas_admision_payload');
            break;
        case 'carreras_admision_payload':
            sendToApiAi(senderID, 'carreras_admision_payload');
            break;


            ///////////////////////////////////////////////////////////////////////////////////////

            //Parte de Admision
        case 'paso1_pre_payload':
            sendToApiAi(senderID, 'paso1_pre_payload');
            break;

        case 'paso2_pre_payload':
            sendToApiAi(senderID, 'paso2_pre_payload');
            break;

        case 'paso3_pre_payload':
            sendToApiAi(senderID, 'paso3_pre_payload');
            break;

        case 'paso4_pre_payload':
            sendToApiAi(senderID, 'paso4_pre_payload');
            break;

        case 'ver_mas_pre_payload':
            sendToApiAi(senderID, 'ver_mas_pre_payload');
            break;
            //Horarios de clases

        case 'horario_derecho_payload':
            sendToApiAi(senderID, 'horario_derecho_payload');
            break;
        case 'horario_contabilidad_payload':
            sendToApiAi(senderID, 'horario_contabilidad_payload');
            break;
        case 'mas_horarios_payload':
            sendToApiAi(senderID, 'mas_horarios_payload');
            break;

            //Investigacion
        case 'proceso_bach_titulo_payload':
            sendToApiAi(senderID, 'proceso_bach_titulo_payload');
            break;
        case 'indice_formato_pregrado_payload':
            sendToApiAi(senderID, 'indice_formato_pregrado_payload');
            break;
        case 'manual_grados_titulos_payload':
            sendToApiAi(senderID, 'manual_grados_titulos_payload');
            break;



        default:
            //unindentified payload
            sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific? esto es para postback");
            break;


    }

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

}


/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    var status = event.account_linking.status;
    var authCode = event.account_linking.authorization_code;

    console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var delivery = event.delivery;
    var messageIDs = delivery.mids;
    var watermark = delivery.watermark;
    var sequenceNumber = delivery.seq;

    if (messageIDs) {
        messageIDs.forEach(function(messageID) {
            console.log("Received delivery confirmation for message ID: %s",
                messageID);
        });
    }

    console.log("All message before %d were delivered.", watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfAuth = event.timestamp;

    // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
    // The developer can set this to an arbitrary value to associate the 
    // authentication callback with the 'Send to Messenger' click event. This is
    // a way to do account linking when the user clicks the 'Send to Messenger' 
    // plugin.
    var passThroughParam = event.optin.ref;

    console.log("Received authentication for user %d and page %d with pass " +
        "through param '%s' at %d", senderID, recipientID, passThroughParam,
        timeOfAuth);

    // When an authentication is received, we'll send a message back to the sender
    // to let them know it was successful.
    sendTextMessage(senderID, "Authentication successful");
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        throw new Error('Couldn\'t validate the signature.');
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac('sha1', config.FB_APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

function sendEmail(topic, body) {

    let helper = require('sendgrid').mail;
    let from_email = new helper.Email('vj.jimenez96@gmail.com');
    let to_email = new helper.Email('vj.jimenez96@gmail.com');
    let subject = topic;
    let content = new helper.Content('text/html', body);
    let mail = new helper.Mail(from_email, subject, to_email, content);
    console.log('Esto funciona de maravilla 3: ', subject);
    let sg = require('sendgrid')(config.SENDGRID_API_KEY);
    let request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON(),
    });

    sg.API(request, function(error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
    });
}

function isDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})