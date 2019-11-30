const { Command } = require('klasa');
const moment = require("moment");
const { createCanvas, loadImage } = require('canvas');
const config = require("../../config");
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            subcommands: true,
            permLevel: 4,
            runIn: [ 'text' ],
            description: 'Manage earnable badges.',
            usage: '<add>',
            usageDelim: ' | ',
            cooldown: 30,
            requiredSettings: [ "botChannel" ],
        });
    }

    async add (message, []) {
        var yangPrice = 0;

        var title = await message.awaitReply(`:question: Please name this badge.
:warning: **Using a title of a badge that already exists will overwrite the other one**`);
        if (!title) return message.send(`:x: Badge wizard canceled / timed out.`);

        var howToGet = await message.awaitReply(`:question: If this badge can be purchased with Yang, specify the number of Yang required to purchase it. Otherwise if this badge can only be awarded by the staff, briefly explain what this badge is awarded for.`, 180000);
        if (!howToGet) return message.send(`:x: Badge wizard canceled / timed out.`);

        if (!isNaN(parseInt(howToGet))) {
            yangPrice = parseInt(howToGet);
            howToGet = "Yang Store";
        }

        await message.send(`:question: Please upload an image attachment containing the badge. Or, send a message containing a link to it. It is highly advised to use square images. You have 3 minutes.`);
        try {
            var messages = await message.channel.awaitMessages(dmessage => dmessage.author.id === message.author.id && (dmessage.attachments.size > 0 || /(https?:\/\/[^\s]+)/g.test(dmessage.content)),
                { max: 1, time: 180000, errors: [ 'time' ] });
        } catch (err) {
            return message.send(`:x: I didn't receive a valid image from you for the badge. The command was canceled.`);
        }
        var themessage = messages.first();
        if (themessage.attachments.size > 0) {
            var url = themessage.attachments.first().url;
        } else {
            var url = themessage.cleanContent;
        }

        var badgeID = Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97);

        if (message.guild.badges.length > 0) {
            var maps = message.guild.badges
                .filter((badge) => badge.name === title)
                .map(async (badge) => {
                    badgeID = badge.ID;
                    await message.guild.settings.update('badges', badge, { action: 'remove' });
                })
            await Promise.all(maps);
        }

        await message.guild.settings.update('badges', {
            ID: badgeID,
            name: title,
            howToGet: howToGet,
            yangPrice: yangPrice,
            image: url,
            active: true
        }, {action: 'add'});
        themessage.delete();

        return message.send(":white_check_mark: Badge has been updated!");
    }
}