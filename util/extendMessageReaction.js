const { Structures } = require('discord.js');

Structures.extend('MessageReaction', MessageReaction => {
    class MyMessageReaction extends MessageReaction {

        constructor(...args) {
            super(...args);

            this.selfRole = () => {
                if (!this.message.guild && !this.message.selfRoleGroup)
                return undefined;

                return this.client.selfroles.get(`${this.message.channel.id}-${this.message.id}-${this.emoji.id}`);
            }
        }

    }

    return MyTextChannel;
});