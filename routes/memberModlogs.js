const { Route } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');

module.exports = class extends Route {

    constructor(...args) {
        super(...args, {
            route: 'profile/modlogs',
            authenticated: true
        });
    }

    async get (request, response) {

        if (!request.query.guild) return response.end(JSON.stringify({ error: "Guild was not specified" }));
        if (!request.query.user) return response.end(JSON.stringify({ error: "User was not specified" }));

        const guild = this.client.guilds.resolve(request.query.guild)
        if (!guild) return response.end(JSON.stringify({ error: "The bot is not in the provided guild." }));

        try {
            var authUser = this.client.users.fetch(request.auth.scope[ 0 ]);
            if (!authUser) throw new Error("Authorized user not found");
            var authMember = await guild.members.fetch(authUser.id);
            if (!authMember) throw new Error("Authorized user does not seem to be in the provided guild.");
        } catch (e) {
            return response.end(JSON.stringify({ error: `Unable to fetch the authorized user.` }));
        }

        if (!authMember.permissions.has('VIEW_AUDIT_LOG') && authUser.id !== request.query.user)
            return response.end(JSON.stringify({ error: `You do not have permission to view other members' mod logs in this guild.` }));

        try {
            var user = await this.client.users.fetch(request.query.user);
            if (!user) throw new Error("User not found");
        } catch (e) {
            return response.end(JSON.stringify({ error: "Unable to fetch the provided user." }));
        }

        const modLogs = user.guildSettings(guild.id).modLogs;

        return response.end(JSON.stringify({ message: modLogs }));
    }

};