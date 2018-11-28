const request = require('request');
const config = require('../config');

let getUserName = (callback, userId) => {
    request({
        uri: 'https://graph.facebook.com/v2.7/' + userId,
        qs: {
            access_token: config.FB_PAGE_TOKEN
        }

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {

            var user = JSON.parse(body);
            console.log('IMPORTANTE1: ', userId);
            console.log('IMPORTANTE2: ', user.first_name);
            if (user.first_name.length > 0) {
                console.log('First name: ', user.first_name);
                callback(user.first_name);
            }
        }

    })
}

module.exports = {
    getUserName
}