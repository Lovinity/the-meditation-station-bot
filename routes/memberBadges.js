const { Route } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');

module.exports = class extends Route {

    constructor(...args) {
        super(...args, {
            route: 'profile/badges',
            authenticated: true,
        });
    }

    async get (request, response) {

        if (!request.query.guild) return response.end(JSON.stringify({ error: "Guild was not specified" }));
        if (!request.query.user) return response.end(JSON.stringify({ error: "User was not specified" }));

        try {
            var authUser = await this.client.users.fetch(request.auth.scope[ 0 ]);
            if (!authUser) throw new Error("Authorized user not found");
            var authMember = await guild.members.fetch(authUser.id);
            if (!authMember) throw new Error("Authorized user does not seem to be in the provided guild.");
        } catch (e) {
            return response.end(JSON.stringify({ error: `Authorized user not found or is not in the guild. You must be in the guild to view the badges of guild members.` }));
        }

        const guild = this.client.guilds.resolve(request.query.guild)
        if (!guild) return response.end(JSON.stringify({ error: "The bot is not in the provided guild." }));

        try {
            var user = await this.client.users.fetch(request.query.user);
            if (!user) throw new Error("User not found");
        } catch (e) {
            return response.end(JSON.stringify({ error: "Unable to fetch the provided user." }));
        }

        const userBadges = user.guildSettings(guild.id).profile.badges;
        const guildBadges = guild.settings.badges;
        var respond = { tag: user.tag, badges: [] };

        if (guildBadges.length > 0 && userBadges.length > 0) {
            guildBadges
                .filter((badge) => userBadges.some((badgeb) => badgeb.ID === badge.ID))
                .map((badge) => {
                    respond.badges.push({ ...badge, earnedOn: userBadges.find((badgeb) => badgeb.ID === badge.ID).earnedOn });
                });
        }

        return response.end(JSON.stringify({ message: respond }));
    }

};