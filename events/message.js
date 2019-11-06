const { Event } = require('klasa');

module.exports = class extends Event {

	async run(message) {
            // First, do spam scoring and XP/Yang rewarding.
            if (message.type === 'DEFAULT' && typeof message.member !== 'undefined' && message !== null)
            {
                var spamScore = await message.spamScore;
                message.member.spamScore(spamScore, message);
                var xp = message.xp;
                message.member.xp(xp, message);
            }
            
		if (this.client.ready) this.client.monitors.run(message);
	}

};



