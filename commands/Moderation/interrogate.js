const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'interrogate',
            enabled: true,
            runIn: [ 'text' ],
            cooldown: 30,
            deletable: true,
            bucket: 1,
            aliases: [],
            guarded: false,
            nsfw: false,
            permissionLevel: 4,
            requiredPermissions: [ "MANAGE_CHANNELS", "MANAGE_ROLES" ],
            requiredSettings: [ "incidentsCategory" ],
            subcommands: false,
            description: 'Initiates an interrogation channel between staff and the provided users, and mutes provided users.',
            quotedStringSupport: false,
            usage: '<user:username> [...]',
            usageDelim: ' | ',
            extendedHelp: ''
        });
    }

    async run (message, [ ...users ]) {
        var overwrites = [];
        var msg = await message.send(`:hourglass_flowing_sand: Please wait...`);
        var response = ``;
        const muted = message.guild.settings.muteRole;
        const mutedRole = message.guild.roles.resolve(muted);
        var userIDs = [];

        // Gather necessary config
        const incidents = message.guild.settings.incidentsCategory;

        // First, handle if any member parameters were provided
        if (users && users.length > 0) {

            // Create a proper response message
            response = `:police_officer: **__STOP; staff have some questions for you__** :police_officer:

Staff have started an interrogation for your recent conduct in the guild; please stand by until a staff member responds.

:small_orange_diamond: You are muted until interrogation is finished.
:small_orange_diamond: The purpose of interrogation is to give you a chance to state your side of the issue and defend yourself.
:small_orange_diamond: At any time, you may state you no longer wish to be interrogated. Staff will then immediately move on to deciding any further action to take, if necessary.
:small_orange_diamond: Anything you say in an interrogation can be used in deciding what actions staff will take, if any.
:small_orange_diamond: **Please stay in the guild and respect the staff.** Otherwise, you will lose the privilege to file an appeal on any/all discipline decided on.
`;

            // Process permission overwrites and response mentions
            users.map((user) => {
                var guildMember = message.guild.members.resolve(user.id);
                if (mutedRole && guildMember) {
                    guildMember.roles.add(mutedRole, `Mute via !interrogate command`);
                }
                response += `<@${user.id}> `;
                userIDs.push(`<@${user.id}> (${user.tag})`);
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
        var channel = await message.guild.channels.create(`interrogation-${Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97)}`, {
            type: 'text',
            topic: `Interrogation ${userIDs.join(", ")}. Initiated by ${message.author.tag} .`,
            parent: incidents,
            permissionOverwrites: overwrites,
            rateLimitPerUser: 15,
            reason: `!interrogate initiated by ${message.author.tag} (${message.author.id})`
        });

        await channel.send(response);

        // Finalize
        await msg.delete();
        return message.delete();
    }

    async init () {

    }

};