const { Route } = require('klasa-dashboard-hooks');
var path = require('path');
var fs = require('fs');

module.exports = class extends Route {

    constructor(...args) {
        super(...args, {
            route: 'profile/badges/image',
        });
    }

    async get (request, response) {
        if (!request.query.id) return response.end(JSON.stringify({ error: "Badge filename was not specified" }));

        fs.readFile(appRoot + '/assets/images/badges/' + request.query.id, async (err, content) => {
            if (err) {
                response.writeHead(400, {'Content-type':'text/html'})
                console.log(err);
                return response.end("No such image");    
            } else {
                //specify the content type in the response will be an image
                response.writeHead({'Content-type':`image/${path.extname(request.query.id).replace('.', '')}`})
                return response.end(content);
            }
        });
    }

};