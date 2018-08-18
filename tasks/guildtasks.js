const {Task} = require('klasa');
const moment = require("moment");

module.exports = class extends Task {

    async run( { guild }) {
        const _guild = this.client.guilds.get(guild);
        if (_guild)
        {
            const statsMessageChannel = _guild.settings.get('statsMessageChannel');
            const statsMessage = _guild.settings.get('statsMessage');

            if (statsMessage && statsMessageChannel)
            {

                // Edit the message containing stats
                var themessage = `:chart_with_upwards_trend: **Current ${_guild.name} Statistics** (edited automatically every minute) :chart_with_upwards_trend: \n\n`;
                themessage = themessage + `Current Guild Time (GMT):  **${moment().format('LLLL')}** \n`;
                themessage = themessage + `Number of members in the guild: **${_guild.members.array().length}** \n`;

                _guild.channels.get(statsMessageChannel).messages.fetch(statsMessage)
                        .then(message => message.edit(themessage));
            }

            var n = new Date();
            var m = n.getMinutes();
            var h = n.getHours();

            if (m === 0 && (h === 6 || h === 12 || h === 18 || h === 0))
            {
                const iceBreakerChannel = _guild.settings.get('iceBreakerChannel');
                const _channel = this.client.channels.get(iceBreakerChannel);
                if (_channel)
                {
                    var iceBreakers = _guild.settings.get('icebreakers');
                    _channel.send(`:snowflake: **Time for another ice breaker question!** :snowflake:
                    
${iceBreakers[Math.floor(Math.random() * iceBreakers.length)]}
`);
                }

            }
    }
    }

};

