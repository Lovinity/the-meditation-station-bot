const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Purchase a text advertisement that will randomly post in generalChannel',
            usage: '',
            usageDelim: '',
            runIn: [ 'text' ],
            requiredSettings: [ "botChannel", "generalChannel" ],
        });
    }

    async run (message, []) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        var adPrice = message.guild.settings.yangStore.advertisement;
        var adPriceHere = message.guild.settings.yangStore.advertisementHere;

        var hereAd = await message.ask(`**Current Advertising Prices**: Regular ad is ${adPrice} Yang per post. Ad with a here mention is ${adPriceHere} Yang per post.
        
Do you want your ad to contain a here mention?`);

        var postMessage = await message.awaitMessage(`:question: Every ad post is randomly between 24 and 48 hours from the previous post. How many times do you want your ad to post in total?`)
        var numPosts = parseInt(postMessage.cleanContent);
        postMessage.delete();

        if (isNaN(numPosts) || numPosts < 1)
            return message.send(`:x: You did not specify a valid number of times for your ad to post, and it must be 1 or more.`);

        var adMessage = await message.awaitMessage(`:question: Please send a message containing your advertisement text. You are limited to 2000 characters. Embeds/attachments are not supported. Your ad text will be rejected if it contains a here or everyone mention. Other mentions included will not work and will be converted to plain text. You have 5 minutes to respond. Be sure to double-check your message before sending it; once sent, it cannot be changed!`, 300000)
        var adText = adMessage.cleanContent;
        await adMessage.delete({ reason: 'Advertisement purchase' });
        if (adText.includes('@here') || adText.includes('@everyone'))
            return message.send(`:x: I told you that you are not allowed to include here nor everyone mentions in your ad text.`);

        if (adMessage.earnedSpamScore >= message.guild.settings.antispamCooldown) {
            return message.send(`:x: Sorry, but that advertisement was deemed spammy by the bot and was rejected. Please try again with different text.`);
        }

        var purchaseAd = () => {
            var adID = Date.now().toString(36) + (message.client.shard ? message.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97)
            message.guild.settings.update('ads', {
                ID: adID,
                author: message.user.id,
                postsLeft: numPosts,
                nextPost: moment().add(1, 'days').add(Math.floor(Math.random() * 24), 'hours').add(Math.floor(Math.random() * 60), 'minutes').toISOString(true),
                hereMention: hereAd,
                adText: adText
            }, { action: 'add' });
            const channel = message.guild.channels.resolve(message.guild.settings.eventLogChannel);
            if (channel) {
                const embed = new MessageEmbed()
                    .setTitle(`Advertisement Purchased`)
                    .setAuthor(message.user.tag)
                    .setColor('#4527A0')
                    .setDescription(adText)
                    .addField(`Number of posts`, numPosts)
                    .addField(`Here mention?`, hereAd)
                    .addField(`Remove this ad`, `If you need to remove this ad, use the command \`!adremove ${adID}\``)
                    .setFooter(`Ad ID ${adID}`)
                channel.send({ embed });
            }
        }

        if (hereAd && await yangStore(message, 'advertisementHere', numPosts)) {
            purchaseAd();
            return message.send(`:white_check_mark: Advertisement has been purchased!
:warning: Be aware if you leave the guild, all remaining purchased advertisements will be removed without refund.`);
        } else if (await yangStore(message, 'advertisement', numPosts)) {
            purchaseAd();
            return message.send(`:white_check_mark: Advertisement has been purchased!
:warning: Be aware if you leave the guild, all remaining purchased advertisements will be removed without refund.`);
        }
    }

};