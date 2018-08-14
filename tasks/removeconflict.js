// This task removes an individual !conflict use from a channel database because the use expired.

const { Task } = require('klasa');

module.exports = class extends Task {

	async run({ channel, user }) {
		const _channel = this.client.channels.get(channel);
		if (_channel) await _channel.settings.update('conflictResolution', `${channel}-${user}`, {action: 'remove'});
	}

};
