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

        var messages = [
            { text: `**__UHH OHH!!!!!__**`, duration: 3000 },
            { text: { files: [ { attachment: `https://img.playbuzz.com/image/upload/ar_1.5,c_pad,f_jpg,b_auto/q_auto:good,f_auto,fl_lossy,w_640,c_limit/cdn/fcd52a6a-8df5-4f36-8477-7ec5d9fd02f0/18db4e36-ae84-43af-a350-aba32540a31a.jpg`, name: `isthatafuckboy.jpg` } ] }, duration: 3000 },
            { text: { files: [ { attachment: `https://media1.tenor.com/images/22b5140d5606c3e3dce22dc40bbd204b/tenor.gif?itemid=13844448`, name: `fuckboy-alert.gif` } ] }, duration: 3000 },
            { text: `**__ <@${user.id}> IS A FUCKBOY! I REPEAT, <@${user.id}> IS A FUCKBOY! __**`, duration: 3000 },
            { text: `Fuckboys don't know how to love; they only know how to lust.`, duration: 3000 },
            { text: `Fuckboys only care about themselves and can't keep their pants up.`, duration: 3000 },
            { text: `Fuckboys poison society's view on sex and make people (especially women and transgender individuals) fear for their safety.`, duration: 3000 },
            { text: `If a fuckboy is not stopped, it's only a matter of time before they become a rapist (if they're not one already).`, duration: 3000 },
            { text: `Sorry, <@${user.id}>. But fuckboys are not welcome here. **I must exterminate you**.`, duration: 3000 }
        ];

        var totalDuration = 0
        messages.map((msg) => {
            setTimeout(() => {
                message.channel.send(msg.text)
            }, msg.duration + totalDuration)
            totalDuration += msg.duration
        })

        setTimeout(() => {
            message.channel.send(`Exterminating fuckboy <@${user.id}> in **__3__**`)
                .then((msg) => {
                    setTimeout(() => {
                        msg.edit(`Exterminating fuckboy <@${user.id}> in **__2__**`)
                        setTimeout(() => {
                            msg.edit(`Exterminating fuckboy <@${user.id}> in **__1__**`)
                            setTimeout(() => {
                                var discipline = new GuildDiscipline(user, message.guild, message.author)
                                    .setType('classE')
                                    .addRule(message.guild.settings.fuckboyRuleNumber)
                                    .setReason(`Being a fuckboy (someone who is only interested in hitting on members or sexually objectifying others)`)
                                    .setMuteDuration(0)
                                    .setYang(500)
                                    .setReputation(50)
                                    .setOther(`In order to remain in the guild without being permanently banned, you must pass a fuckboy interrogation process which staff will perform here. You will be subject to several tests in which you must pass without acting like a fuckboy. If you act like a fuckboy even once during this test, you will fail and will be permanently banned from the guild.`)
                                discipline.prepare()
                                    .then(prepared => {
                                        prepared.finalize();
                                        msg.edit(`**__POOF!__**`)
                                    });
                            }, 2000)
                        }, 2000)
                    }, 2000)
                })
        }, 3000  + totalDuration)
    }
};
