const {Event} = require('klasa');
const moment = require("moment");

module.exports = class extends Event {

    run(messages) {
        var modLog;
        for (const message of messages)
        {
            if (message.command && message.command.deletable)
                for (const msg of message.responses)
                    msg.delete();
        }

        var data = ``;
        messages.array().sort(function (a, b) {
            return a.id - b.id;
        }).map((message) => {

            // Remove XP/Yang
            if (typeof message.member !== 'undefined')
            {
                var xp = 0 - message.xp;
                message.member.xp(xp, message);
            }

            // Get the configured modLog channel.
            if (!modLog)
            {
                if (typeof message.guild !== 'undefined')
                    modLog = message.guild.settings.modLogChannel;
            }

            // Write each message to data
            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}, channel ${message.channel.name}+++\n`;
            data += `-Time: ${moment(message.createdAt).format()}\n`;
            // Write attachment URLs
            message.attachments.array().map((attachment) => {
                data += `-Attachment: ${attachment.url}\n`;
            });
            // Write embeds as JSON
            message.embeds.forEach((embed) => {
                data += `-Embed: ${JSON.stringify(embed)}\n`;
            });
            // Write the clean version of the message content
            data += `${message.cleanContent}\n\n\n`;
        });

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog)
            return;

        const _channel = this.client.channels.resolve(modLog);

        // Create a buffer with the data
        var buffer = new Buffer(data, "utf-8");

        // Send the buffer to the staff channel as a txt file
        _channel.send(`:wastebasket: :wastebasket: Multiple messages were deleted in bulk.`, {files: [{attachment: buffer, name: `bulkDelete_${moment().valueOf()}.txt`}]});
    }

};


