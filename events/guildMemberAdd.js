const {Event} = require('klasa');
const _ = require("lodash");

module.exports = class extends Event {

    run(guildMember) {

        // Get the configured modLog channel.
        const modLog = guildMember.guild.settings.get('modLogChannel');

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog)
            return;

        const _channel = this.client.channels.get(modLog);

        // send a log to the channel
        _channel.send(`:tada: The member <@!${guildMember.user.id}> just joined the guild. They created their account on ${guildMember.user.createdAt.toUTCString()}`);

        // Reassign saved roles, if any, to the member. Also, creates a settings entry in the database for them if it doesn't exist
        const verified = guildMember.guild.settings.get(`verifiedRole`);
        const verifiedRole = guildMember.guild.roles.get(verified);
        if (verifiedRole)
        {
            // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
            var _temp = guildMember.user.settings[guildMember.guild.id].roles;
            var temp = _.cloneDeep(_temp);
            temp.push(verifiedRole.id);
            guildMember.roles.add(temp);
        }

    }

};

