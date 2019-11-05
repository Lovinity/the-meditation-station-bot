// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [ '8', 'magic', '8ball', 'mirror' ],
            description: 'Magic 8-Ball, does exactly what the toy does.',
            usage: '<query:str>'
        });
    }

    async run (msg, [ question ]) {
        if (question.endsWith('?') && await yangStore(msg, '8ball', 1)) {
            return msg.reply(`🎱 ${answers[ Math.floor(Math.random() * answers.length) ]}`);
        }
        return msg.reply("🎱 That doesn't look like a question, try again please.");
    }

};

const answers = [
    'I do not know.',
    'Definitely not.',
    'I hope so.',
    'Sorry, not in your wildest dreams.',
    'It is possible.',
    'Pretty likely.',
    'I think so.',
    'I hope not, lmao.',
    'Never!',
    'Nope, forget about it.',
    'Are you actually asking me that?',
    'Definitely!',
    'Oh, absolutely!',
    'No, absolutely not!',
    'The future is bleak.',
    'I am uncertain about that.',
    'I would rather not say.',
    'Why does that matter anyway?',
    'Possibly.',
    'If you get lucky.',
    'There is a small chance.',
    'Yes!'
];