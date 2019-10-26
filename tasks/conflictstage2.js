// This task executes after conflict resolution activates. SEND_MESSAGES for @everyone is re-granted, and the bot begins to ask resolving questions.

const {Task} = require('klasa');
const moment = require('moment');

module.exports = class extends Task {

    async run( { channel }) {
        const _channel = this.client.channels.resolve(channel);
        if (_channel) {
// rename the channel to remove "-MUTED", taking the channel mute off
            await _channel.setName(_channel.name.replace("-muted", ""), 'Channel mute expired');

            // Add a 5 minute timer for the next stage in conflict resolution
            const conflictstage3 = await this.client.schedule.create('conflictstage3', moment().add(5, 'minutes').toDate(), {
                data: {
                    channel: _channel.id
                }
            });

            // Ask the first series of questions to the community.
            await _channel.send(`:two: Now that we are more calm, I unmuted the channel. Each member involved in the conflict, please take the next 5 minutes to answer these questions:
            
*What is the conflict? Stick solely to objective facts when explaining the conflict.
*How does the conflict make **you** feel? Use "I" statements, and avoid blaming nor talking about other people; stick solely to you.
*What do **you** need to happen to put this conflict to rest?

Please do not respond to other people's responses yet. Those not involved in the conflict, please be patient and stay silent for now.
`)
    }
    }

};


