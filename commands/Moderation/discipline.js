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
        if (!message.channel.parent || (message.channel.parent.id !== message.guild.settings.incidentsCategory && message.channel.parent.id !== message.guild.settings.staffCategory))
        {
            await message.channel.send(`:x: I can't let you discipline someone in public! Please use the !discipline command in a staff or incidents channel.`);
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
        var collector = await menu.run(await message.send('Please wait...'), {time: 300000, filter: (reaction, user) => user.id === message.author.id});
        var choice = await collector.selection;
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
                var duration = await message.awaitReply(`:question: How many ${type === 'mute' ? `hours` : `days`} should this ${type} last? ${type === 'mute' ? `Answer "0" for indefinite.` : ``} You have 5 minutes to respond.`, 300000);
                if (!duration)
                {
                    await discipline.cancel();
                    return message.send(`:x: The wizard timed out and was canceled.`);
                }
                if (isNaN(parseInt(duration)))
                {
                    await message.send(`:x: An invalid number was provided. We will assume ${type === 'mute' ? `1 hour` : `1 day`}.`);
                    duration = 1;
                }
                duration = parseInt(duration);
                await discipline.setDuration((type === 'tempban') ? (60 * 24 * duration) : (60 * duration));
            }

            // Next, ask for a reason
            var reason = await message.awaitReply(`:question: Please state the reason for this action concisely but completely. Please do not provide additional instruction here; that will be asked later. You have 5 minutes to respond.`, 300000);
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
            }

            // Ask for any additional discipline or instruction
            var other = await message.awaitReply(`:question: If there is any other discipline or instructions for the user, such as requiring the user to make an apology, please state so here. If there is no other further discipline or instruction, send "none". You have 5 minutes to respond.`, 300000);
            if (!other)
            {
                await discipline.cancel();
                return message.send(`:x: The wizard timed out and was canceled.`);
            }
            if (other.toLowerCase() !== 'none')
                await discipline.setOther(other);

            await discipline.finalize();
            return message.send(`:white_check_mark: Discipline has been sent!`);
        } else {
            return message.send(`:stop_button: The request was canceled.`);
    }
    }

    async init() {
    }

};


