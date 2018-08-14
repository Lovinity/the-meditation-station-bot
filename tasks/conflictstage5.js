// This closes conflict resolution by removing all conflictResolution entries from the channel, and posts a final message

const {Task} = require('klasa');

module.exports = class extends Task {

    async run( { channel }) {
        const _channel = this.client.channels.get(channel);
        if (_channel) {
            // Remove all conflictResolution entries, including ACTIVE.
            await _channel.settings.reset('conflictResolution');
            
            // Post a final message
            await _channel.send(`:star: Give yourselves a pat on the back for taking the time to process this conflict in a civil way.

If this conflict resolved peacefully, staff may, at their discretion, reward all parties involved for their effort in this.
Thank you everyone for taking the time to resolve this conflict.
`);
    }
    }

};


