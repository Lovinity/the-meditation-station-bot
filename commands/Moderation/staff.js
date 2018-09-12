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
            usage: '[user:username] [...]',
            usageDelim: ' ',
            extendedHelp: 'When provided with no arguments, the command will create a text channel between the author and the staff. When arguments are provided, and the author has permission level 4 or above, a private text channel is created between the provided members and staff.'
        });
    }

    async run(message, [...users]) {
        var overwrites = [];
        var msg = await message.send(`:hourglass_flowing_sand: Please wait...`);
        var response = ``;
        // Gather necessary config
        const incidents = message.guild.settings.get(`incidentsCategory`);

        // First, handle if any member parameters were provided
        if (users && users.length > 0)
        {
            // Check to see if author is staff. If not, bail with an error message.
            const {permission} = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return msg.edit(`:x: Sorry, but only staff may specify sapecific members to be added to the private channel. Try this command again without any arguments.`);

            // Create a proper response message
            response = `:eye_in_speech_bubble: **__You have been asked to speak with staff__** :eye_in_speech_bubble: 

You are seeing this channel because a staff member asked to speak with you (via the !staff command). Please be patient until a staff member gets with you.
Channels like this may or may not be created as a result of misconduct; being in this channel does not guarantee you are in trouble.
            
`;

            // Process permission overwrites and response mentions
            users.forEach(function (user) {
                response += `<@${user.id}> `;
                overwrites.push({
                    id: user.id,
                    allow: [
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
                allow: [
                    "ADD_REACTIONS",
                    "VIEW_CHANNEL",
                    "SEND_MESSAGES",
                    "EMBED_LINKS",
                    "ATTACH_FILES",
                    "READ_MESSAGE_HISTORY"
                ],
                type: 'member'
            });

            // Create a proper response message
            response = `:eye_in_speech_bubble: **__You have asked to speak privately with staff__** :eye_in_speech_bubble: 

You are seeing this channel because you used the !staff command to request to speak with staff privately.
            
**If you are reporting someone for misconduct**, please include any/all evidence and information to show their misconduct, including screenshots, or audio recordings of VC incidents, if necessary.
You may consider using the command \`!report username/mention/snowflake\` in this channel as well; if several members use this on the same person within a period of time, they will automatically be muted until staff investigate. Please do not abuse this command.
            
**If you are not reporting someone for misconduct**, please post your inquiry here, and staff will get to you as soon as possible.
            
Thank you, <@${message.author.id}>!
`;

        }

        // Add deny permissions for @everyone
        overwrites.push({
            id: msg.channel.guild.defaultRole,
            deny: [
                "VIEW_CHANNEL",
            ],
            type: 'role'
        });
        
        // Process permission overwrites for staff
        if (message.guild.settings.modRole)
        {
            overwrites.push({
                id: message.guild.settings.modRole,
                allow: [
                    "ADD_REACTIONS",
                    "VIEW_CHANNEL",
                    "SEND_MESSAGES",
                    "MANAGE_MESSAGES",
                    "MENTION_EVERYONE",
                    "MANAGE_ROLES",
                    "EMBED_LINKS",
                    "ATTACH_FILES",
                    "READ_MESSAGE_HISTORY"
                ],
                type: 'role'
            });
        }

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
        
        await channel.send(response);

        // Finalize
        await msg.delete();
        return message.delete();
    }

    async init() {

    }

};