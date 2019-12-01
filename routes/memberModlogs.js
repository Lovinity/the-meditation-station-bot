const { Route } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');
const moment = require("moment");

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
            var authUser = await this.client.users.fetch(request.auth.scope[ 0 ]);
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

        var modLogs = user.guildSettings(guild.id).modLogs;

        var compare = function (a, b) {
            try {
                if (moment(a.date).valueOf() < moment(b.date).valueOf()) { return 1 }
                if (moment(a.date).valueOf() > moment(b.date).valueOf()) { return -1 }
                return 0;
            } catch (e) {
                console.error(e)
            }
        }
        modLogs = modLogs.sort(compare);
        
        var respond = [];
        if (modLogs.length > 0) {
            var maps = modLogs.map(async (log) => {
                log.date = moment(log.date).format("LLL");
                log.user = log.user.tag;
                log.moderator = log.moderator.tag;
                log.channelRestrictions = log.channelRestrictions.map(async (restriction) => {
                    var chan = this.client.channels.fetch(restriction);
                    if (chan) {
                        return chan.name;
                    } else {
                        return `Unknown channel ${restriction}`
                    }
                });
                await Promise.all(log.channelRestrictions);
                log.permissions = log.permissions.map(async (permission) => {
                    var role = guild.roles.resolve(permission);
                    if (role) {
                        return role.name;
                    } else {
                        return `Unknown role ${permission}`
                    }
                });
                await Promise.all(log.permissions);
                delete log.channel;
                log.expiration = moment(log.expiration).format("LLL");
                respond.push(log);
            });
            await Promise.all(maps);
        }

        return response.end(JSON.stringify({ message: { tag: user.tag, modLogs: respond } }));
    }

};