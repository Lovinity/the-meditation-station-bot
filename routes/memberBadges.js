const { Route } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');

module.exports = class extends Route {

    constructor(...args) {
        super(...args, { route: 'profile/badges' });
    }

    async get (request, response) {

        if (!request.query.guild) return response.end(JSON.stringify({ error: "Guild was not specified" }));
        if (!request.query.user) return response.end(JSON.stringify({ error: "User was not specified" }));

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
        var respond = {tag: user.tag, badges: []};

        if (guildBadges.length > 0 && userBadges.length > 0) {
            guildBadges
            .filter((badge) => userBadges.some((badgeb) => badgeb.ID === badge.ID))
            .map((badge) => {
                respond.badges.push({...badge, earnedOn: userBadges.find((badgeb) => badgeb.ID === badge.ID).earnedOn});
            });
        }

        return response.end(JSON.stringify({ message: respond }));
    }

};