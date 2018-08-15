const {Event} = require('klasa');
const moment = require("moment");
module.exports = class extends Event {

    run(message) {
        if (message.command && message.command.deletable)
            for (const msg of message.responses)
                msg.delete();
        
        // Get the configured modLog channel.
        const modLog = message.guild.settings.get('modLogChannel');

        // End if there is no configured channel
        if (!modLog)
            return;

        const _channel = this.client.channels.get(modLog);

        // send a log to the channel
        _channel.send(`:wastebasket: A message was deleted.`);

        var data = `\`\`\``;
        data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}, channel ${message.channel.name}+++\n`;
        data += `-Time: ${moment(message.createdAt).format()}\n`;
        // Write attachment URLs
        message.attachments.array().forEach(function (attachment) {
            data += `-Attachment: ${attachment.url}\n`;
        });
        // Write embeds as JSON
        message.embeds.forEach(function (embed) {
            data += `-Embed: ${JSON.stringify(embed)}\n`;
        });
        // Write the clean version of the message content
        data += `${message.cleanContent}\`\`\``;
        _channel.send(data);


    }

};

