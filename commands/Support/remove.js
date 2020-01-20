const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'remove',
            enabled: true,
            runIn: [ 'text' ],
            cooldown: 5,
            deletable: true,
            bucket: 1,
            aliases: [],
            guarded: false,
            nsfw: false,
            permissionLevel: 0,
            requiredPermissions: [ "MANAGE_CHANNELS", "MANAGE_ROLES" ],
            requiredSettings: [ "incidentsCategory" ],
            subcommands: false,
            description: 'Remove a specific member from a support channel you created.',
            quotedStringSupport: false,
            usage: '<user:username>',
            usageDelim: ' | ',
            promptLimit: 1,
            promptTime: 60000,
            extendedHelp: 'Use this command to remove someone in a support channel you created who is not being supportive.'
        });
    }

    async run (message, [ user ]) {
        if (!message.channel.name.startsWith(`support-`))
            return message.send(':x: This command may only be used in a support channel.')

        if (!message.channel.topic || !message.channel.topic.includes(`initiated by ${message.author.tag}`))
            return message.send(':x: This command may only be used by the person who created the support channel.')

            message.channel.createOverwrite(user, {
                VIEW_CHANNEL: false,
                READ_MESSAGE_HISTORY: false
            }, "Creator of support channel removed user via !remove command");

            return message.send(':white_check_mark: User removed. Please let staff know with the !staff command if that user was violating the rules.')
    }

    async init () {

    }

};