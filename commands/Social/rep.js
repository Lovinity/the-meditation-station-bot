const { Command } = require('klasa');
const moment = require('moment');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Award 10 good reputation to a member of your choosing for Yang.',
            usage: '<user:username> <reason:str>',
            usageDelim: ' | ',
            cooldown: 30,
            runIn: [ 'text' ],
            requiredSettings: [ "botChannel" ],
            extendedHelp: 'You can use this command once every 24 hours to award 10 good reputation to a member in the guild. Format: rep guildMember | reason for repping. Abuse of the rep command could be disciplined.'
        });
    }

    async run (message, [ user, reason ]) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        // Disallow repping if user has a restriction
        if (message.member.settings.restrictions.cannotGiveReputation) {
            var msg = await message.send(`:lock: Sorry, but staff have forbidden you from being able to give good reputation to other members.`);
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        // Disallow repping if canRep is false
        if (!message.member.settings.canRep) {
            var msg = await message.send(`:x: Sorry, but you can only !rep someone once every 24 hours.`);
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        // Purchase repping
        if (await yangStore(message, 'repMember', 1)) {
            var settings = await user.guildSettings(message.guild.id);
            await settings.update(`goodRep`, settings.goodRep + 10)
            const channel2 = message.guild.channels.resolve(message.guild.settings.eventLogChannel);
            if (channel2) {
                channel2.send(`:rep: User ${message.author.tag} (${message.author.id}) repped ${user.tag} (${user.id}) for the following reason: ${reason}`);
            }

            settings = await message.author.guildSettings(message.guild.id)
            await settings.update(`canRep`, false)
            const timer = await this.client.schedule.create('repAgain', moment().add(24, 'hours').toDate(), {
                data: {
                    guild: message.guild.id,
                    user: message.author.id
                }
            });
            return message.send(`:white_check_mark: You have repped that user. Thank you for sharing the love!`);
        }
    }

};
