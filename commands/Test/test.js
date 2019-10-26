const {Command} = require('klasa');
var wait = require('wait-for-stuff');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [],
            permissionLevel: 10,
            usage: ''
        });
    }

    async run(message, []) {

        // Initiate data variable
        var data = ``;
        var messageArray = [];
        
        var msg = await message.send(`Please wait...`);

        // Iterate through the messages, sorting by ID, and add them to data

        let getMessages = () => {
            return new Promise(async (resolve, reject) => {
                wait.for.time(5);
                var msgs = await message.channel.messages.fetch({limit: 100});
                if (msgs)
                {
                    msgs.array().map(message => messageArray.push(message));
                    if (msgs.array().length >= 100)
                        await getMessages();
                }
                return resolve();
            });
        };

        await getMessages();

        messageArray.sort(function (a, b) {
            return a.id - b.id;
        }).forEach((message) => {

            // Write attachments
            message.attachments.array().forEach((attachment) => {
                data += `<!+${attachment.url}>`;
            });

            // Write the content
            data += `${message.content}`;

            // Indicate new message
            data += `<!NEW>`;
        });

        // Create a buffer with the data
        var buffer = Buffer.from(data);
        
        msg.delete();

        // Send the buffer to the staff channel as a txt file
        return message.send(`Generated file`, {files: [{attachment: buffer, name: `${message.channel.name}.txt`}]});

        //return message.send('DONE', {files: []});
    }

};