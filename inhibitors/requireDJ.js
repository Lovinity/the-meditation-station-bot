const { Inhibitor } = require("klasa");

module.exports = class extends Inhibitor {

    constructor(...args) {
        super(...args, { spamProtection: true });
    }

    async run(msg, cmd) {
        if (!cmd.requireDJ) return;
        if (msg.channel.type !== "text") throw "This command may be only executed in a server.";

        if (!msg.guild.settings.music.djMode) return;
        const {permission} = await this.client.permissionLevels.run(msg, 2);
        if (permission) return;
        throw `:x: ***Only a DJ may use the loop command***`;
    }

};
