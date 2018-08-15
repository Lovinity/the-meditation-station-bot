const {Event} = require('klasa');
var jsdiff = require('diff');
const moment = require("moment");

module.exports = class extends Event {

    async run(old, message) {
        if (this.client.ready && old.content !== message.content)
            this.client.monitors.run(message);

        // Skip the bot
        if (message.author.id === this.client.user.id)
            return;

        // Get the configured modLog channel.
        const modLog = message.guild.settings.get('modLogChannel');

        // End if there is no configured channel
        if (!modLog)
            return;

        const _channel = this.client.channels.get(modLog);

        var oldContent = ``;
        var newContent = ``;

        // Old message first
        old.attachments.array().forEach(function (attachment) {
            oldContent += `-Attachment: ${attachment.url}\n`;
        });
        // Write embeds as JSON
        old.embeds.forEach(function (embed) {
            oldContent += `-Embed: ${JSON.stringify(embed)}\n`;
        });
        // Write the clean version of the message content
        oldContent += `${old.cleanContent}`;

        // Process new message
        message.attachments.array().forEach(function (attachment) {
            newContent += `-Attachment: ${attachment.url}\n`;
        });
        // Write embeds as JSON
        message.embeds.forEach(function (embed) {
            newContent += `-Embed: ${JSON.stringify(embed)}\n`;
        });
        // Write the clean version of the message content
        newContent += `${message.cleanContent}`;

        // Get the differences between old and new
        var diff = jsdiff.diffWordsWithSpace(oldContent, newContent);
        var newstring = '';
        diff.forEach(function (part) {
            if (part.added) {
                newstring = `${newstring} #+${part.value}+#`;
            } else if (part.removed) {
                newstring = `${newstring} #-${part.value}-#`;
            } else {
                newstring = `${newstring}${part.value}`;
            }
        });

        // send a log to the channel
        _channel.send(`:pencil: A message was edited.`);
        var returnData = `\`\`\``;
        returnData += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}, channel ${message.channel.name}+++\n`;
        returnData += `-Time: ${moment(message.createdAt).format()}\n`;
        returnData += `${newstring}\`\`\``;
        _channel.send(returnData);



    }

};


