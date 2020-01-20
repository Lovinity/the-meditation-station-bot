// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const MarkovChain = require('markovchain');
const yangStore = require('../../util/yangStore');
const messageLimitHundreds = 1;

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Generate a markov chain from the provided text channel.',
            requiredPermissions: [ 'READ_MESSAGE_HISTORY' ],
            usage: '<channel:channel>',
            cooldown: 60,
            runIn: [ 'text' ],
            promptLimit: 1,
            promptTime: 60000
        });
    }

    async run (message, [ channel ]) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        if (channel.type !== 'text') return message.send(':x: The provided channel is not a text channel.');

        if (await yangStore(message, 'markov', 1)) {
            let messageBank = await channel.messages.fetch({ limit: 100 });
            for (let i = 1; i < messageLimitHundreds; i++) {
                messageBank = messageBank.concat(await channel.messages.fetch({ limit: 100, before: messageBank.last().id }));
            }

            const quotes = new MarkovChain(messageBank.map(message => message.content).join(' '));
            const chain = quotes.start(this.useUpperCase).end(20).process();
            return message.send(chain.substring(0, 1999));
        }
    }

    useUpperCase (wordList) {
        const tmpList = Object.keys(wordList).filter((word) => word[ 0 ] >= 'A' && word[ 0 ] <= 'Z');
        return tmpList[ Math.floor(Math.random() * tmpList.length) ];
    }

};