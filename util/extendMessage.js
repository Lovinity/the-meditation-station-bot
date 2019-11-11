const { Structures } = require('discord.js');

Structures.extend('Message', Message => {
    class MyMessage extends Message {

        constructor(...args) {
            super(...args);

            this.selfRoleGroup = () => {
                if (!this.guild)
                return undefined;

                return this.client.selfrolegroups.get(`${this.channel.id}-${this.id}`);
            }
        }

    }

    return MyMessage;
});