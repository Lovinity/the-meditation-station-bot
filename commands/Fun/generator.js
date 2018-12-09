// Uses npm fantasy-names

const gen = require('fantasy-names');
const {Command} = require('klasa');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: ['text'],
            requiredSettings: ["botChannel"],
            cooldown: 30,
            permissionLevel: 0,
            description: 'Uses NPM fantasy-names to generate pretty much anything.',
            quotedStringSupport: false,
            usage: '[group:string] [individual:string] [quantity:integer{,20}]',
            usageDelim: ' | ',
            extendedHelp: 'See https://github.com/mattconsto/fantasy-names'
        });
    }

    async run(message, [group, individual, quantity = 1]) {
        if (group)
            group = group.replace(" ", "_");
        if (individual)
            individual = individual.replace(" ", "_");
        if (message.channel.id !== message.guild.settings.botChannel)
            return message.send(`:x: Sorry, but this command may only be used in the bot channel.`);

        var response = ``;
        try {
            response = gen(group, individual, quantity);
        } catch (e) {
            return message.send(e);
        }

        if (await yangStore(message, 'generator', quantity))
            return message.send(response);
        return;
        
    }

    async init() {
        /*
         * You can optionally define this method which will be run when the bot starts
         * (after login, so discord data is available via this.client)
         */
    }

};


