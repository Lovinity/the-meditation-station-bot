const { Route, util: { encrypt } } = require('klasa-dashboard-hooks');

module.exports = class extends Route {

    constructor(...args) {
        super(...args, { route: 'login' });
    }

    async get (request, response) {

        if (!request.query.state) return response.end(JSON.stringify({ error: "state was not specified" }));
        if (!request.query.redirect_uri) return response.end(JSON.stringify({ error: "redirect_uri was not specified" }));

        if (!request.query.redirect_uri.startsWith(this.client.options.dashboardHooks.origin)) return response.end(JSON.stringify({ error: "Disallowed redirect_uri" }));

        var state = encrypt({
            ID: request.query.state,
            redirect: request.query.redirect_uri
        }, this.client.options.clientSecret);

        var discordURL = `https://discordapp.com/api/oauth2/authorize?client_id=${this.client.options.clientID}&redirect_uri=${encodeURI(`${this.client.options.dashboardHooks.origin}/api/oauth/callback`)}&response_type=code&scope=identify&state=${encodeURI(state)}`

        response.writeHead(302,
            { Location: discordURL }
        );

        return response.end();
    }

};