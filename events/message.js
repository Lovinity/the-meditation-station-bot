const { Event } = require('klasa');

module.exports = class extends Event {

	async run(message) {
            // First, do spam scoring and XP/Yang rewarding.
            if (typeof message.member !== 'undefined')
            {
                var spamScore = await message.spamScore;
                message.member.spamScore(spamScore, message);
                var xp = message.xp;
                message.member.xp(xp, message);
            }
            
		if (this.client.ready) this.client.monitors.run(message);
	}

};



