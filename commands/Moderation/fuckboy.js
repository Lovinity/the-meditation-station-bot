const { Command } = require('klasa');
const GuildDiscipline = require('../../util/guildDiscipline');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'fuckboy',
            permLevel: 4,
            runIn: [ 'text' ],
            description: 'WE GOT A FUCKBOY ON DECK! We must shame them and then exterminate them immediately!',
            usage: '<user:username>',
            usageDelim: ' | ',
            requiredSettings: [ "incidentsCategory", "staffCategory" ],
        });
    }

    async run (message, [ user ]) {
        message.channel.send(`uhh ohh!`)
        setTimeout(() => {
            message.channel.send(`**__UHH OHH!!!!!__**`)
            setTimeout(() => {
                message.channel.send({ files: [ { attachment: `https://img.playbuzz.com/image/upload/ar_1.5,c_pad,f_jpg,b_auto/q_auto:good,f_auto,fl_lossy,w_640,c_limit/cdn/fcd52a6a-8df5-4f36-8477-7ec5d9fd02f0/18db4e36-ae84-43af-a350-aba32540a31a.jpg`, name: `isthatafuckboy.jpg` } ] })
                setTimeout(() => {
                    message.channel.send(`**__MAYDAY! MAYDAY! FUCKBOY ALERT!__**`)
                    setTimeout(() => {
                        message.channel.send({ files: [ { attachment: `https://media1.tenor.com/images/22b5140d5606c3e3dce22dc40bbd204b/tenor.gif?itemid=13844448`, name: `fuckboy-alert.gif` } ] })
                        setTimeout(() => {
                            message.channel.send(`**__ <@${user.id}> IS A FUCKBOY! I REPEAT, <@${user.id}> IS A FUCKBOY! __** MUST EXTERMINATE! MUST EXTERMINATE!`)
                            setTimeout(() => {
                                message.channel.send(`Exterminating fuckboy <@${user.id}> in **__3__**`)
                                    .then((msg) => {
                                        setTimeout(() => {
                                            msg.edit(`Exterminating fuckboy <@${user.id}> in **__2__**`)
                                            setTimeout(() => {
                                                msg.edit(`Exterminating fuckboy <@${user.id}> in **__1__**`)
                                                setTimeout(() => {
                                                    var discipline = new GuildDiscipline(user, message.guild, message.author)
                                                        .setType('mute')
                                                        .setReason(`Being a fuckboy`)
                                                        .setDuration(0);
                                                    discipline.prepare()
                                                        .then(prepared => {
                                                            prepared.finalize();
                                                            msg.edit(`**__POOF!__** Fuckboy gone.`)
                                                        });
                                                }, 2000)
                                            }, 2000)
                                        }, 2000)
                                    })
                            }, 5000)
                        }, 5000)
                    }, 3000)
                }, 5000)
            }, 2000)
        }, 2000)
    }

};
