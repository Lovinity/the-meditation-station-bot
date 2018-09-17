const gen = require('fantasy-names');
const {Command} = require('klasa');

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

    async run(message, [group, individual, quantity]) {
        if (group)
            group = group.replace(" ", "_");
        if (individual)
            individual = individual.replace(" ", "_");
        if (message.channel.id !== message.guild.settings.get('botChannel'))
            return message.send(`:x: Sorry, but this command may only be used in the bot channel.`);

        return message.send(gen(group, individual, quantity));
    }

    async init() {
        /*
         * You can optionally define this method which will be run when the bot starts
         * (after login, so discord data is available via this.client)
         */
    }

};


