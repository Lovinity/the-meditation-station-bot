const {Event} = require('klasa');
const {MessageEmbed} = require('discord.js');
const moment = require("moment");
module.exports = class extends Event {

    run(message) {
        if (message.command && message.command.deletable)
            for (const msg of message.responses)
                msg.delete();
        // Skip the bot
        if (message.author.id === this.client.user.id)
            return;

        // Remove XP/Yang
        if (typeof message.member !== 'undefined')
        {
            var xp = 0 - message.xp;
            message.member.xp(xp, message);
        }

        // Get the configured modLog channel.
        const modLog = message.guild.settings.get('modLogChannel');

        // End if there is no configured channel
        if (!modLog)
            return;

        var display = new MessageEmbed()
                .setTitle(`Deleted Message`)
                .setDescription(`${message.cleanContent}`)
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setFooter(`Message created **${message.createdAt}** in channel **${message.channel.name}**`);

        const _channel = this.client.channels.get(modLog);

        // Write attachment URLs
        message.attachments.array().forEach(function (attachment) {
            display.addField(`Contained Attachment`, attachment);
        });
        // Write embeds as JSON
        message.embeds.forEach(function (embed) {
            display.addField(`Contained Embed`, JSON.stringify(embed));
        });

        _channel.sendEmbed(display, `:wastebasket: A message ${message.id} was deleted.`);


    }

};

