const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [],
            permissionLevel: 10,
            usage: ''
        });
    }

    async run(message, []) {
        const {schema} = this.client.gateways.guilds;
        //schema.add("botChannel", { type: "TextChannel" });
        //schema.add("botGamesChannel", { type: "TextChannel" });
        //schema.add("modLogChannel", { type: "TextChannel" });
        //schema.add("iceBreakerChannel", { type: "TextChannel" });
        //schema.add("announcementsChannel", { type: "TextChannel" });
        //schema.add("noSelfModRole", { type: "Role" });
        //schema.add("muteRole", { type: "Role" });
        //schema.add("modRole", { type: "Role" });
        //schema.add("raidRole", { type: "Role" });
        //schema.add("conflictResolutionMembers", { type: "Integer", default: 3 });
        //schema.add("conflictResolutionTime", { type: "Integer", default: 15 });
        //schema.add("verifiedRole", { type: "Role"});
        //schema.add("guildTasks", { type: "string", configurable: false});
        //schema.add("statsMessageChannel", { type: "string"});
        //schema.add("statsMessage", { type: "string"});
        //schema.add("reportMembers", {type: "Integer", default: 3});
        //schema.add("reportTime", {type: "Integer", default: 60});
        //schema.add("pendSuspensions", {type: "any", array: true, configurable: false});
        //schema.add("pendBans", {type: "any", array: true, configurable: false});
        //schema.add("pendIncidents", {type: "any", array: true, configurable: false});
        //schema.add("incidentsCategory", {type: "categorychannel"});
        //schema.add("staffCategory", {type: "categorychannel"});
        //schema.add("antispamCooldown", {type: "integer", default: 50});
        //schema.add("antispamLessStrictRoles", {type: "Role", array: true});
        //schema.add("antispamLessStrictChannels", {type: "TextChannel", array: true});
        //schema.add("raidscore", {type: "integer", default: 0, configurable: false});
        //schema.add("raidMitigation", {type: "integer", default: 0, configurable: false});
        //schema.add("selfRoles", {type: "Role", array: true});
        return message.send(`done`);
    }

};

