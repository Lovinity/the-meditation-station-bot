const {Command, util, RichMenu} = require('klasa');
const {MessageEmbed} = require('discord.js');
const GuildDiscipline = require('../../util/guildDiscipline');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            enabled: true,
            runIn: ['text'],
            deletable: true,
            permissionLevel: 4,
            requiredPermissions: ["MANAGE_ROLES"],
            requiredSettings: ["muteRole", "incidentsCategory", "staffCategory"],
            description: 'Starts the discipline wizard to issue either a warning, discipline, mute, suspension, or ban to a user. Must be used in a staff or incidents channel.',
            quotedStringSupport: false,
            usage: '<user:username>',
            extendedHelp: ''
        });
    }

    async run(message, [user]) {
        // Bail if the command was not run in a staff category channel or incidents category channel.
        if (!message.channel.parent || (message.channel.parent.id !== message.guild.settings.get('incidentsCategory') && message.channel.parent.id !== message.guild.settings.get('staffCategory')))
        {
            await message.channel.send(`:x: For confidentiality, the discipline command may only be used in a staff channel or incidents channel.`);
            return message.delete({reason: `Use of !discipline channel outside of a staff or incidents channel`});
        }

        // First, ask what kind of discipline to issue

        var menu = new RichMenu(new MessageEmbed()
                .setTitle(`Choose a discipline for ${user.tag}`)
                .setDescription(`Use number reactions to select which kind of discipline to issue.`)
                );
        menu.addOption(`warn`, `Warns the user of unacceptable behaviour, but does not issue any disciplinary action.`);
        menu.addOption(`discipline`, `Issue Yang fines, take away XP, and/or apply bad reputation.`);
        menu.addOption(`mute`, `Add the muteRole to the user, temporarily or indefinitely. Optionally, also add discipline.`);
        menu.addOption(`tempban`, `Suspend/ban the user from the guild temporarily. Optionally, also add discipline.`);
        menu.addOption(`ban`, `Permanently ban the user from the guild. Optionally, also add discipline.`);
        var collector = await menu.run(await message.channel.send('Please wait...'), {time: 300000, filter: (reaction, user) => user.id === msg.author.id});
        var choice = await collector.selection;
        collector.message.delete();
        if (menu.options[choice])
        {
            var type = menu.options[choice].name;
            // Prepare the discipline
            var discipline = await new GuildDiscipline(user, message.guild, message.author);
            discipline.setType(type);
            discipline.prepare();

            // Next, ask for a duration if type is mute or tempban
            if (type === 'mute' || type === 'tempban')
            {
                var duration = await message.awaitReply(`:question: How many ${type === 'mute' ? `minutes` : `days`} should this ${type} last? ${type === 'mute' ? `Answer "0" for indefinite.` : ``} You have 5 minutes to respond.`, 300000);
                if (!duration)
                {
                    await discipline.cancel();
                    return message.send(`:x: The wizard timed out and was canceled.`);
                }
                if (isNaN(parseInt(duration)))
                {
                    await message.send(`:x: An invalid number was provided. We will assume ${type === 'mute' ? `30 minutes` : `1 day`}.`);
                    duration = (type === 'mute') ? 30 : 1;
                }
                duration = parseInt(duration);
                await discipline.setDuration((type === 'tempban') ? (60 * 24 * duration) : duration);
            }

            // Next, ask for a reason
            var reason = await message.awaitReply(`:question: Please provide a reason/explanation for this discipline. You have 5 minutes to respond.`, 300000);
            if (!reason)
            {
                await discipline.cancel();
                return message.send(`:x: The wizard timed out and was canceled.`);
            }
            await discipline.setReason(reason);

            // Continue with the additional questions only if type is not warning
            if (type !== 'warn')
            {
                // Ask for bad reputation
                var badRep = await message.awaitReply(`:question: How much bad reputation should be assigned to this user? Use "0" for none. You have 5 minutes to respond.`, 300000);
                if (!badRep)
                {
                    await discipline.cancel();
                    return message.send(`:x: The wizard timed out and was canceled.`);
                }
                if (isNaN(parseInt(badRep)))
                {
                    await message.send(`:x: An invalid number was provided. We will assume ${type === 'mute' ? `0` : `25`} bad rep.`);
                    badRep = (type === 'mute') ? 0 : 25;
                }
                badRep = parseInt(badRep);
                await discipline.setReputation(badRep);

                // Ask for Yang charge
                var yang = await message.awaitReply(`:question: How much Yang should be charged from this user? Use "0" for none. You have 5 minutes to respond.`, 300000);
                if (!yang)
                {
                    await discipline.cancel();
                    return message.send(`:x: The wizard timed out and was canceled.`);
                }
                if (isNaN(parseInt(yang)))
                {
                    await message.send(`:x: An invalid number was provided. We will assume ${type === 'mute' ? `0` : `250`} Yang.`);
                    yang = (type === 'mute') ? 0 : 250;
                }
                yang = parseInt(yang);
                await discipline.setYang(yang);

                // Ask for XP charge
                var xp = await message.awaitReply(`:question: How much XP should be removed from the user? **You should ONLY remove XP that was earned through abuse; do not charge XP as punishment** Use "0" for none. You have 5 minutes to respond.`, 300000);
                if (!xp)
                {
                    await discipline.cancel();
                    return message.send(`:x: The wizard timed out and was canceled.`);
                }
                if (isNaN(parseInt(xp)))
                {
                    await message.send(`:x: An invalid number was provided. We will assume 0 XP.`);
                    xp = 0;
                }
                xp = parseInt(xp);
                await discipline.setXp(xp);

                // Ask for any additional discipline
                var other = await message.awaitReply(`:question: If any other manual discipline is to be assigned, such as requiring the user to make an apology, please state so here. If there is no other further discipline, send "none". You have 5 minutes to respond.`, 300000);
                if (!other)
                {
                    await discipline.cancel();
                    return message.send(`:x: The wizard timed out and was canceled.`);
                }
                if (other !== 'none')
                    await discipline.setOther(other);
            }

            await discipline.finalize();
            return message.send(`:white_check_mark: Discipline has been sent!`);
        } else {
            return message.send(`:stop_button: The request was canceled.`);
    }
    }

    async init() {
    }

};


