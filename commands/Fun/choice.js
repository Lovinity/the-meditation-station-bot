// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [ 'choose', 'decide' ],
            description: 'Makes a decision for you given some choices.',
            usage: '<choices:str> [...]',
            usageDelim: '|'
        });
    }

    async run (msg, choices) {
        if (choices.length === 1 && await yangStore(msg, 'choice', 1)) {
            return msg.reply(`I think you should go with "${choices[ Math.floor(Math.random() * choices.length) ]}"`);
        }
        return msg.reply('You only gave me one choice, dummy.');
    }

};