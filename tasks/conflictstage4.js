// this task asks the last set of conflict resolution questions.

const {Task} = require('klasa');
const moment = require('moment');

module.exports = class extends Task {

    async run( { channel }) {
        const _channel = this.client.channels.resolve(channel);
        if (_channel) {
            // Set a 5 minute timer for the closing message
            const conflictstage5 = await this.client.schedule.create('conflictstage5', moment().add(5, 'minutes').toDate(), {
                data: {
                    channel: _channel.id
                }
            });
            
            // Ask the last set of questions
            await _channel.send(`:four: Finally, now that we all have a better understanding of each other and the conflict, take these last 5 minutes to answer the following as a group:
            
*What steps will you take, either now and/or in the future, to resolve this conflict and prevent it in the future?

Those who were not involved in the conflict may also provide respectful input to the above question.
`);   
    }
    }

};


