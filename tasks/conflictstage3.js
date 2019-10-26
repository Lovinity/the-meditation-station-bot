// This task asks the second set of conflict resolution questions.

const {Task} = require('klasa');
const moment = require('moment');

module.exports = class extends Task {

    async run( { channel }) {
        const _channel = this.client.channels.resolve(channel);
        if (_channel) {
            // Set a 5 minute timer for the next stage in conflict resolution
            const conflictstage4 = await this.client.schedule.create('conflictstage4', moment().add(5, 'minutes').toDate(), {
                data: {
                    channel: _channel.id
                }
            });
            
            // Ask the second set of questions
            await _channel.send(`:three: A lot of times, conflict arises because of misunderstanding. Take the next 5 minutes to read what everyone else said and do the following:

*Empathize with the other members involved. Write up what your own understanding is of the other members' perspectives. This is about **them**, not you. Stay objective and leave personal bias, insults, and blaming out.
*When a misunderstanding is noticed, politely and objectively correct the misunderstandings without using insults, blames, nor defensive language.

Those not involved in the conflict, please be patient and remain silent.
`);   
    }
    }

};