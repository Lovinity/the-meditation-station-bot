const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'support',
            enabled: true,
            runIn: [ 'text' ],
            cooldown: 300,
            deletable: true,
            bucket: 1,
            aliases: [],
            guarded: false,
            nsfw: false,
            permissionLevel: 0,
            requiredPermissions: [ "MANAGE_CHANNELS", "MANAGE_ROLES" ],
            requiredSettings: [ "incidentsCategory" ],
            subcommands: false,
            description: 'Use this command when you need support from staff and other members for a very sensitive matter.',
            quotedStringSupport: false,
            usage: '[incident:string]',
            usageDelim: ' | ',
            extendedHelp: 'When you use this command, a private support channel will be created between you and the staff. In addition, a message will be posted letting other members know if they want to join the private channel with you to offer support, they can use another bot command to do so.'
        });
    }

    async run (message, [ incident ]) {

        if (message.member.settings.restrictions.cannotUseSupportCommand)
            return message.send(`:lock: Sorry, but staff forbid you from using the support command due to past abuse. If you need support, please DM a member who has given you consent to do so.`);

        var overwrites = [];
        if (!incident) {
            var ID = Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97);
            const embed = new MessageEmbed()
                .setTitle(`A member has requested support from other members`)
                .setAuthor(message.author.tag)
                .setColor('#FBFB70')
                .setDescription("This member has requested support from the community. If you would like to offer support, use the bot command below to be added to the private text channel. We greatly appreciate your willingness to be a friend.")
                .addField(`Use this command to be added to the channel`, `!support ${ID}`)
                .setFooter(`Be aware that very sensitive, triggering, and personal information might be discussed in the channel. Do not share anything discussed within that channel outside of the channel.`)
                .setTimestamp();
            var response = ``;

            // Gather necessary config
            const incidents = message.guild.settings.incidentsCategory;
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
            response = `:rainbow: **__Support channel for ${message.author.tag}__** :rainbow: 

${message.author.tag} has requested support from the community. Here, you may offer support for them. All rules still apply, especially with regards to privacy. **Anything discussed in this text channel must not be discussed outside of this text channel**

Sensitive or triggering information might also be discussed. NSFW content is allowed in this channel if it directly pertains to the support and follows the guild's NSFW rules.

<@${message.author.id}> , you may use the command \`!remove username/mention/snowflake\` in this channel if you want to remove someone who is not being supportive or understanding of you. This command will not work on administrators.

This channel will automatically be deleted by the bot when it goes 48 hours without a message being sent.
            `;

            // Add deny permissions for @everyone and for the muted role
            overwrites.push({
                id: message.channel.guild.roles.everyone,
                deny: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            });

            if (message.guild.settings.muteRole) {
                overwrites.push({
                    id: message.guild.settings.muteRole,
                    deny: [
                        "VIEW_CHANNEL",
                    ],
                    type: 'role'
                });
            }

            // Create the support channel
            var channel = await message.guild.channels.create(`support-${ID}`, {
                type: 'text',
                topic: `Support channel initiated by ${message.author.tag}`,
                nsfw: true,
                parent: incidents,
                permissionOverwrites: overwrites,
                rateLimitPerUser: 10,
                reason: `!support initiated by ${message.author.tag} (${message.author.id})`
            });

            await channel.send(response);

            return message.send({ embed: embed });
        } else {
            // Check if the support channel exists and bail if it does not
            var theChannel = message.guild.channels.cache.find(r => r.name === `support-${incident}`)
            if (!theChannel)
                return message.send(':x: That support channel does not exist. Either it was typed incorrectly, or it was removed / closed.')

            if (!theChannel.permissionsFor(message.member).has('READ_MESSAGE_HISTORY'))
                return message.send(':x: You were previously removed from that support channel and may not re-join.')

            theChannel.createOverwrite(message.member, {
                ADD_REACTIONS: true,
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                EMBED_LINKS: true,
                ATTACH_FILES: true,
                READ_MESSAGE_HISTORY: true
            }, "Gained access with !support command");

            theChannel.send(`<@${message.author.id}>, you have been added to this support channel. Thank you for offering your help! Remember, all rules apply. Anything discussed in this channel stays in this channel. Sensitive or triggering information might be discussed.`)
        }
    }

    async init () {

    }

};