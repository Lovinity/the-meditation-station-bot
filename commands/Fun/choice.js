// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [ 'choose', 'decide' ],
            description: 'Makes a decision for you given some choices.',
            usage: '<choices:str> [...]',
            usageDelim: ' | '
        });
    }

    async run (message, choices) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        if (choices.length > 1 && await yangStore(msg, 'choice', 1)) {
            return message.reply(`I think you should go with "${choices[ Math.floor(Math.random() * choices.length) ]}"`);
        }
        return message.reply('You only gave me one choice, dummy.');
    }

};