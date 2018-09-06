const { Event } = require('klasa');

module.exports = class extends Event {

	run(message) {
            // First, do spam scoring.
            if (typeof message.member !== 'undefined')
            {
                var spamScore = message.spamScore;
                message.member.spamScore(spamScore, message);
            }
            
		if (this.client.ready) this.client.monitors.run(message);
	}

};



