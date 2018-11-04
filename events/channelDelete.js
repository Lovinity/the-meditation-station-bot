const {Event} = require('klasa');
const moment = require("moment");

module.exports = class extends Event {

    run(channel) {
        // Get the configured modLog channel.
        const modLog = channel.guild.settings.modLogChannel;

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog || channel.type !== 'text')
            return;
        
        const _channel = this.client.channels.get(modLog);

        // Initiate data variable
        var data = `ARCHIVE of deleted text channel ${channel.name}, ID ${channel.id}\nCreated on ${moment(channel.createdAt).format()}\nDeleted on ${moment().format()}\n\n`;
        data += `+++Members who could view this channel:+++ \n\n`;

        // Write the list of participants to the data
        channel.members.array().forEach(function (member) {
            data += `${member.user.username}#${member.user.discriminator} (${member.id})\n`;
        });
        data += `\n\n`;

        // Iterate through the messages, sorting by ID, and add them to data
        var messages = channel.messages;
        messages.array().sort(function (a, b) {
            return a.id - b.id;
        }).forEach(function (message) {
            // Write each message to data
            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
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
            data += `${message.cleanContent}\n\n\n`;
        });

        // Create a buffer with the data
        var buffer = new Buffer(data, "utf-8");

        // Send the buffer to the staff channel as a txt file
        _channel.send(`:speech_left: :wastebasket: The channel ${channel.name} (${channel.id}) was deleted.`, {files: [{attachment: buffer, name: `${channel.name}.txt`}]});


    }

};

