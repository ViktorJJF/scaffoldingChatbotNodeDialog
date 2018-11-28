const axios = require('axios');

const getWeather = async(direccion) => {

    //-----------------------------------Parte de hacer llamado a Api de Google Places ----------------

    let encodedUrl = encodeURI(direccion);
    // console.log(encodedUrl);

    let respuesta = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedUrl}&key=AIzaSyA-HXVa2jtkGfKtIJwisxgC46RaWqC1xuI`)

    if (respuesta.data.status == 'ZERO_RESULTS') {
        throw new Error('No hay resultados para la ciudad ', direccion);
    }


    let location = respuesta.data.results[0];
    let coors = location.geometry.location;
    let latitudePlace = coors.lat;
    let lengthPlace = coors.lng;



    //-------------------------------------Parte de Open Weather Map ------------------------------//
    let clima = await axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=${latitudePlace}&lon=${lengthPlace}&units=metric&appid=b13e5d1f5d8720f5344e3108b5249bfa`);
    let climaMain = clima.data.main;
    let temp = climaMain.temp;
    // let prueba = clima.data.main.temp;

    return temp;
}

module.exports = {
    getWeather
}