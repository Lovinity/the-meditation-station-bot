const {Command} = require('klasa');
const needle = require('needle');
var wait = require('wait-for-stuff');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permLevel: 4,
            botPerms: [],
            runIn: ['text'],
            description: 'Creates a resource channel using a specially-formatted text file as an attachment to the command message.',
            usage: '',
            usageDelim: ''
        });
    }

    async run(message, []) {
        if (message.attachments.size < 1)
            return message.send(`:x: I need a txt file to generate a channel!`);

        var data = [];
        var maps = message.attachments.array().map(attachment => {
            return new Promise((resolve, reject) => {
                needle('get', attachment.url, {decode_response: false})
                        .then((response) => {
                            var arr = response.body.split("<!NEW>");
                            arr.map((msg, index) => {
                                var regExp = /<\!\+([^>]+)\>/g;
                                var matches = null;
                                var attachments = [];
                                matches = regExp.exec(msg);
                                var theString = msg;
                                while (matches !== null)
                                {
                                    theString = theString.replace(matches[0], '');
                                    attachments.push(matches[1]);
                                    matches = regExp.exec(msg);
                                }
                                msg = theString;
                                data.push({content: msg, files: attachments});
                            });

                            return resolve();
                        })
                        .catch(function (err) {
                            console.log('Call the locksmith!')

                            return reject(err);
                        });
            });
        });

        await Promise.all(maps);
        
        data.map(msg => {
           message.channel.send(msg.content, {files: msg.files}); 
           wait.for.time(5);
        });

        return message.delete();
    }

};


