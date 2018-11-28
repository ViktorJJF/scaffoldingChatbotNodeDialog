const http = require("http");
const axios = require("axios");


//setInterval(function() {
//    http.get("https://smart-ujcm.herokuapp.com/");
//}, 300000); // every 5 minutes (300000)

axios.get('https://smart-ujcm.herokuapp.com/')
    .then(response => {
        console.log(response.data);
        console.log(response.data.explanation);
    })
    .catch(error => {
        console.log(error);
    });