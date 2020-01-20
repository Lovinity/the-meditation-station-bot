const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'staff',
            enabled: true,
            runIn: [ 'text' ],
            cooldown: 600,
            deletable: true,
            bucket: 1,
            aliases: [],
            guarded: false,
            nsfw: false,
            permissionLevel: 0,
            requiredPermissions: [ "MANAGE_CHANNELS", "MANAGE_ROLES" ],
            requiredSettings: [ "incidentsCategory" ],
            subcommands: false,
            description: 'Initiates a private text channel between you and the staff, say, to report incidents in private. Or, if members provided, initiates a private staff channel between staff and those members without muting them.',
            quotedStringSupport: false,
            usage: '[user:username] [...]',
            usageDelim: ' | ',
            extendedHelp: ''
        });
    }

    async run (message, [ ...users ]) {
        var overwrites = [];
        var msg = await message.send(`:hourglass_flowing_sand: Please wait...`);
        var response = ``;

        if (message.member.settings.restrictions.cannotUseStaffCommand)
            return msg.edit(`:lock: Sorry, but staff forbid you from using the staff command due to past abuse. Please DM a staff member directly if you need to speak with them or report a member.`);

        // Gather necessary config
        const incidents = message.guild.settings.incidentsCategory;

        // First, handle if any member parameters were provided
        if (users && users.length > 0) {
            // Check to see if author is staff. If not, bail with an error message.
            const { permission } = await this.client.permissionLevels.run(message, 4);
            if (!permission)
                return msg.edit(`:x: No no, only staff can specify specific members to be added to an incidents channel. Please use the command without any arguments.`);

            // Create a proper response message
            response = `:eye_in_speech_bubble: **__Hey, the staff would like to speak with you__** :eye_in_speech_bubble: 

Staff would like to speak with you about something. This intervention was initiated by <@${message.author.id}> . Please wait until a staff member posts their inquiry.
Intervention channels do not usually mean that you are in trouble, unlike interrogation channels.
`;

            // Process permission overwrites and response mentions
            users.map((user) => {
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
            response = `:eye_in_speech_bubble: **__Staff, <@${message.author.id}> would like to speak with you__** :eye_in_speech_bubble: 

A member used the !staff command to ask to speak with you in private.
            
<@${message.author.id}>, **If you are reporting someone for misconduct**, please include any/all evidence and information to show their misconduct, including screenshots, or audio recordings of VC incidents, if necessary.
You may consider using the command \`!report username/mention/snowflake\` in this channel as well; if several members use this on the same person within a period of time, they will automatically be muted until staff investigate. Please do not abuse this command.
            
**If you are not reporting someone for misconduct**, please post your inquiry here, and staff will get to you as soon as possible.
            
Thank you!`;

        }

        // Add deny permissions for @everyone
        overwrites.push({
            id: msg.channel.guild.roles.everyone,
            deny: [
                "VIEW_CHANNEL",
            ],
            type: 'role'
        });

        // Process permission overwrites for staff
        if (message.guild.settings.modRole) {
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
        var channel = await message.guild.channels.create(`intervention-${Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97)}`, {
            type: 'text',
            topic: `Intervention channel initiated by ${message.author.tag}`,
            parent: incidents,
            permissionOverwrites: overwrites,
            rateLimitPerUser: 15,
            reason: `!staff initiated by ${message.author.tag} (${message.author.id})`
        });

        await channel.send(response);

        // Finalize
        await msg.delete();
        return message.delete();
    }

    async init () {

    }

};