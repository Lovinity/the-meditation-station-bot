const { Route } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');
const moment = require("moment");

module.exports = class extends Route {

    constructor(...args) {
        super(...args, { route: 'profile' });
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

        const userSettings = user.guildSettings(guild.id);

        const guildMember = guild.members.fetch(user.id)
        var joined;
        if (guildMember)
            joined = guildMember.joinedAt;

            var xp = userSettings.xp;
            var level = Math.floor(0.177 * Math.sqrt(xp)) + 1;
            var upper = Math.ceil((level / 0.177) ** 2);
            var lower = Math.ceil(((level - 1) / 0.177) ** 2);
            var fillValue = Math.min(Math.max((xp - lower) / (upper - lower), 0), 1);

        var respond = {
            tag: user.tag,
            title: userSettings.profile.title,
            avatar: user.displayAvatarURL({ format: 'png' }),
            background: userSettings.profile.background,
            xp: userSettings.xp,
            activity: parseInt(userSettings.activityScore * 100) / 100,
            joined: joined ? moment(joined).format("YYYY-MM-DD") : "N/A",
            goodrep: userSettings.goodRep,
            badrep: userSettings.badRep,
            yang: userSettings.yang,
            xpprogress: parseInt(fillValue * 100),
            level: level,
            identities: userSettings.profile.identities,
            dob: userSettings.profile.dob,
            location: userSettings.profile.location,
            info: userSettings.profile.info,
            donations: userSettings.profile.donations,
            pronouns: userSettings.pronouns
        }

        return response.end(JSON.stringify({ message: respond }));
    }

};