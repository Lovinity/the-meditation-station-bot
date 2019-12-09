/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const {Command} = require('klasa');
const config = require("../../config");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Change your server nickname. Names with profanity or special characters are not allowed.',
            usage: '<nick:str>',
            usageDelim: '',
            cooldown: 60,
            requiredSettings: ["botChannel"],
        });
    }

    async run(message, [nick]) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }
        
        // Test for profanity
        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, nick, false);
            if (numbers.length > 0)
            {
                return message.send(`:x: Hey now, no naughty words in your nickname.`);
            }
        });

        // Test for special characters
        if (/[^\x20-\x7E]/g.test(nick))
        {
            return message.send(`:x: You don't need weird characters in your nickname.`);
        }

        await message.member.setNickname(nick, `Requested from the !nick command`);

        return message.send(`:white_check_mark: Your nickname has been changed. Yay!`);
    }

};


function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}