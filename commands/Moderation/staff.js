const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'staff',
            enabled: true,
            runIn: ['text'],
            cooldown: 600,
            deletable: true,
            bucket: 1,
            aliases: [],
            guarded: false,
            nsfw: false,
            permissionLevel: 0,
            requiredPermissions: ["MANAGE_CHANNELS", "MANAGE_ROLES"],
            requiredSettings: ["incidentsCategory"],
            subcommands: false,
            description: 'Initiates a private text channel between you and the staff, say, to report incidents in private.',
            quotedStringSupport: false,
            usage: '[member:member] [...]',
            usageDelim: ' ',
            extendedHelp: 'When provided with no arguments, the command will create a text channel between the author and the staff. When arguments are provided, and the author has permission level 4 or above, a private text channel is created between the provided members and staff.'
        });
    }

    async run(message, [...member]) {
        var overwrites = [];
        var msg = await message.send(`:hourglass_flowing_sand: Please wait...`);
        // Gather necessary config
        const incidents = message.guild.settings.get(`incidentsCategory`);

        // First, handle if any member parameters were provided
        if (member && member.length > 0)
        {
            // Check to see if author is staff. If not, bail with an error message.
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return msg.edit(`:x: Sorry, but only staff may specify sapecific members to be added to the private channel. Try this command again without any arguments.`);

            // Process permission overwrites
            member.forEach(function (guildMember) {
                overwrites.push({
                    id: guildMember.id,
                    allowed: [
                        "ADD_REACTIONS",
                        "VIEW_CHANNEL",
                        "SEND_MESSAGES",
                        "EMBED_LINKS",
                        "ATTACH_FILES",
                        "READ_MESSAGE_HISTORY"
                    ],
                    type: 'member'
                });
            });
            // No member parameters
        } else {
            // Process permission overwrites for author
            overwrites.push({
                id: message.author.id,
                allowed: [
                    "ADD_REACTIONS",
                    "VIEW_CHANNEL",
                    "SEND_MESSAGES",
                    "EMBED_LINKS",
                    "ATTACH_FILES",
                    "READ_MESSAGE_HISTORY"
                ],
                type: 'member'
            });
        }
        
        // Add deny permissions for @everyone
        overwrites.push({
                id: msg.channel.guild.defaultRole,
                denied: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            });

        // Create the incidents channel
        var channel = await message.guild.channels.create('int_i', {
            type: 'text',
            topic: `Private staff channel initiated by ${message.author.username}#${message.author.discriminator}`,
            parent: incidents,
            overwrites: overwrites,
            reason: `!staff initiated by ${message.author.username}#${message.author.discriminator} (${message.author.id})`
        });

        // rename it to its own ID
        await channel.setName(`int_i_${channel.id}`, `Incident assigned ID ${channel.id}`);

        // Finalize
        return msg.edit(`:white_check_mark: A channel has been created for you. Go to <#${channel.id}>`);
    }

    async init() {

    }

};