const { Command, util, RichMenu } = require('klasa');
const { MessageEmbed } = require('discord.js');
const GuildDiscipline = require('../../util/guildDiscipline');
const moment = require('moment');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            enabled: true,
            runIn: [ 'text' ],
            deletable: true,
            permissionLevel: 5,
            requiredPermissions: [ "MANAGE_ROLES" ],
            requiredSettings: [ "muteRole", "incidentsCategory", "staffCategory" ],
            description: 'Starts the discipline wizard to issue either a warning, discipline, mute, suspension, or ban to a user. Must be used in a staff or incidents channel.',
            quotedStringSupport: false,
            usage: '<user:username>',
            extendedHelp: '',
            promptLimit: 1,
            promptTime: 60000
        });
    }

    async run (message, [ user ]) {
        // Bail if the command was not run in a staff category channel or incidents category channel.
        if (!message.channel.parent || (message.channel.parent.id !== message.guild.settings.incidentsCategory && message.channel.parent.id !== message.guild.settings.staffCategory)) {
            await message.send(`:x: I can't let you discipline someone in public! Please use the !discipline command in a staff or incidents channel.`);
            return message.delete({ reason: `Use of !discipline channel outside of a staff or incidents channel` });
        }

        var settings = await user.guildSettings(message.guild.id);

        // Send a message containing information about the user's disciplinary records
        // Get the modLogs
        const modLogs = settings.modLogs;

        var rules = {};

        // Count each discipline type in actions, and place each log in its appropriate type in cases
        modLogs.map((log) => {
            if (typeof log.rules !== 'undefined' && log.rules.length > 0) {
                log.rules.map((rule) => {
                    if (typeof rules[ `Rule ${rule}` ] === 'undefined')
                        rules[ `Rule ${rule}` ] = [];
                    rules[ `Rule ${rule}` ].push({ type: log.type, id: log.case, issued: log.date, moderator: log.moderator.tag, valid: log.valid });
                })
            }
        });

        var response = `__**MODERATION LOGS IN A BRIEF**__` + "\n\n"
        Object.entries(rules).map(([ key, value ]) => {
            if (value.length > 0) {
                value = value.filter(record => record.valid)
            }
            if (value.length > 0) {
                response += `**Actions issued regarding ${key}**: ` + "\n"
                value.map((record) => {
                    response += `🔹${record.type} on ${moment(record.issued).format("LLL")}` + "\n"
                })
                response += "\n"
            }
        });

        var HP = await user.HP(message.guild.id);
        response += `**Current HP**: ${HP}` + "\n"
        if (HP > 0) {
            response += `Member does **not** qualify for a ban on this discipline (unless they violated the zero tolerance policy).` + "\n\n"
        } else {
            response += `:warning: **Member qualifies for a temporary or permanent ban**. Please ask yourself if this member is causing more harm than good to the community. If so, this discipline should be a class F temporary or permanent ban.` + "\n\n"
        }
        response += `**Current Yang**: ${settings.yang}` + "\n"
        response += `**Current XP**: ${settings.xp}` + "\n"
        response += `**Active Bot Restrictions**: ${Object.entries(settings.restrictions).map(([key, value]) => value ? `${key} ` : undefined)}` + "\n\n"

        var separateMessage = await message.channel.send(response, { split: true });

        // First, ask what kind of discipline to issue
        var menu = new RichMenu(new MessageEmbed()
            .setTitle(`Choose the highest class discipline for ${user.tag}`)
            .setDescription(`G is the highest class and A is the lowest class. You have 10 minutes to pick an option.`)
        );
        menu.addOption(`classA`, `Warning`);
        menu.addOption(`classB`, `Basic Discipline (Yang fine, HP damage, and/or loss of XP)`);
        menu.addOption(`classD`, `Reflection / Research (Require apology, research paper, retraction statement, and/or quiz).`);
        menu.addOption(`classE`, `Access Restrictions (Indefinite or timed mute, channel restrictions, and/or roles that restrict permissions).`);
        menu.addOption(`classF`, `Ban (Temporary or Permanent).`);
        menu.addOption(`classG`, `Report / Investigation by Third Party (Discord TOS violation and/or report to police).`);
        var collector = await menu.run(await message.channel.send('Please wait...'), { time: 600000, filter: (reaction, user) => user.id === message.author.id });
        var choice = await collector.selection;
        if (menu.options[ choice ]) {
            var discipline = new GuildDiscipline(user, message.guild, message.author);
            discipline.setType(menu.options[ choice ].name);
            try {
                switch (menu.options[ choice ].name) {
                    case 'classA':
                        await collector.message.delete();
                        discipline.prepare();
                        await askRulesReason(message, discipline);
                        await askOther(message, discipline);
                        break;
                    case 'classB':
                        await collector.message.delete();
                        discipline.prepare();
                        await askRulesReason(message, discipline);
                        await askClassB(message, discipline);
                        await askOther(message, discipline);
                        break;
                    case 'classD':
                        await collector.message.delete();
                        discipline.prepare();
                        await askRulesReason(message, discipline);
                        await askClassB(message, discipline);
                        await askClassD(message, discipline);
                        await askOther(message, discipline);
                        break;
                    case 'classE':
                        await askWillMute(message, discipline);
                        await collector.message.delete();
                        discipline.prepare();
                        await askRulesReason(message, discipline);
                        await askClassB(message, discipline);
                        var hasAccountability = await askClassD(message, discipline);
                        await askClassE(message, user, settings, discipline, hasAccountability);
                        await askOther(message, discipline);
                        break;
                    case 'classF':
                        if (HP > 0) {
                            var confirm = await askClassF(message, discipline);
                            if (!confirm) {
                                await discipline.cancel();
                                break;
                            }
                        }
                        await collector.message.delete();
                        discipline.prepare();
                        await askRulesReason(message, discipline);
                        var isPermanentBan = await askClassF(message, discipline);
                        await askClassB(message, discipline);
                        if (!isPermanentBan) {
                            var hasAccountability = await askClassD(message, discipline);
                            await askClassE(message, user, discipline, hasAccountability);
                        }
                        await askOther(message, discipline);
                        break;
                    case 'classG':
                        await collector.message.delete();
                        discipline.prepare();
                        await askRulesReason(message, discipline);
                        await askOther(message, discipline);
                        break;
                    default:
                        await discipline.cancel();
                        return message.channel.send(`:x: Unknown choice selected: ${menu.options[ choice ].name}`);
                }
            } catch (e) {
                await discipline.cancel();
                return message.channel.send(`:x: ${e.message}`);
            }

            await discipline.finalize();
            return message.channel.send(`:white_check_mark: Discipline has been sent!`);
        } else {
            return message.channel.send(`:stop_button: The request was canceled.`);
        }
    }

    async init () {
    }

};


// Helper functions
async function askRulesReason (message, discipline) {
    // Ask for the rule numbers violated
    var rules = await message.awaitReply(`:question: **Rule Numbers Violated**: Please state which rule number(s) pertain to this discipline. Separate multiple rule numbers with a space (eg. "1 5 12 19"). You have 10 minutes to respond.`, 600000);
    if (!rules) {
        throw new Error("No rules specified")
    }
    rules = rules.split(" ");
    rules.map((rule) => discipline.addRule(rule));

    // Next, ask for a reason
    var reason = await message.awaitReply(`:question: **What Did the Member Do?**: Briefly but specifically explain what the member did that was against the rules. Keep the length under 1024 characters. Please do not provide additional instruction/discipline here; that will be asked later. You have 10 minutes to respond.`, 600000);
    if (!reason) {
        throw new Error("No reasons specified")
    }
    discipline.setReason(reason);
}

async function askOther (message, discipline) {
    // Ask for any additional discipline or instruction
    var other = await message.awaitReply(`:question: **Other discipline**: If there is any other discipline or instructions for the user not already covered by this wizard, please state so here. Keep the length under 1024 characters. If there is no other further discipline or instruction, send "none". You have 10 minutes to respond.`, 600000);
    if (!other) {
        throw new Error("No other discipline specified")
    }
    if (other.toLowerCase() !== 'none')
        discipline.setOther(other);
}

async function askClassB (message, discipline) {
    // Ask for HP damage (bad reputation)
    var HP = await message.awaitReply(`:question: **HP damage**: How much HP damage should the user take (you can issue more damage than they have)?. You should issue HP depending on how much of a disturbance they caused the community, generally between 0 and 100 HP. You are allowed to issue more HP damage than HP they have. You have 10 minutes to respond.`, 600000);
    if (!HP) {
        throw new Error("No HP specified")
    }
    if (isNaN(parseInt(HP))) {
        await message.channel.send(`:x: An invalid number was provided. We will assume 25 HP damage.`);
        HP = 25;
    }
    HP = parseInt(HP);
    discipline.setHPDamage(HP);

    // Ask for Yang charge
    var yang = await message.awaitReply(`:question: **Yang Fine**: How much Yang should be charged from this user? Use "0" for none. Generally, fine 10 Yang for every 1 HP damage. You are allowed to fine more than the user has in their balance. You have 10 minutes to respond.`, 600000);
    if (!yang) {
        throw new Error("No yang specified")
    }
    if (isNaN(parseInt(yang))) {
        await message.channel.send(`:x: An invalid number was provided. We will assume 250 Yang.`);
        yang = 250;
    }
    yang = parseInt(yang);
    discipline.setYang(yang);

    // Ask for XP charge
    var xp = await message.awaitReply(`:question: **XP Removal**: How much XP should be removed from the user? **You should ONLY remove XP that was earned through abuse; do not charge XP as punishment** Use "0" for none. You have 10 minutes to respond.`, 600000);
    if (!xp) {
        throw new Error("No XP specified")
    }
    if (isNaN(parseInt(xp))) {
        await message.channel.send(`:x: An invalid number was provided. We will assume 0 XP.`);
        xp = 0;
    }
    xp = parseInt(xp);
    discipline.setXp(xp);
}

async function askClassD (message, discipline) {
    var isAccountable = false;
    var classD = {
        apology: false,
        research: false,
        retraction: false,
        quiz: false
    }

    var resp = await message.awaitReply(`:question: **Apologies**: If this member should be required to write formal / reflective apologies, please explain below in complete sentences, including the members/groups the apology/ies should be addressed to. Do not include base requirements. Send "none" to not require any apologies. You have 10 minutes to respond.`, 600000);
    if (!resp) {
        throw new Error("No apology specified")
    }
    if (resp.toLowerCase() !== 'none') {
        classD.apology = resp;
        isAccountable = true;
    }

    var resp = await message.awaitReply(`:question: **Research papers**: If this member should be required to do a research paper, please explain below in complete sentences. Do not include base research paper requirements; those are already included. Specify "none" if the user does not have to write any research papers. You have 10 minutes to respond.`, 600000);
    if (!resp) {
        throw new Error("No research specified")
    }
    if (resp.toLowerCase() !== 'none') {
        classD.research = resp;
        isAccountable = true;
    }

    var resp = await message.awaitReply(`:question: **Retraction Statements**: If this member should be required to make a retraction statement(s), explain below in complete sentences. Do not include base retraction statement requirements; those are already included. Specify "none" if the user does not have to make any retraction statements. You have 10 minutes to respond.`, 600000);
    if (!resp) {
        throw new Error("No retraction specified")
    }
    if (resp.toLowerCase() !== 'none') {
        classD.retraction = resp;
        isAccountable = true;
    }

    var resp = await message.awaitReply(`:question: **Quizzes**: If this member should be required to take and pass any quizzes, explain below in complete sentences (including what would be considered "passing") and include link(s) to the quiz(zes). If the quiz is not yet made, include reading material links and indicate a quiz will be made and the link will be posted in the incident channel. Specify "none" if the user does not have to take any quizzes. You have 10 minutes to respond.`, 600000);
    if (!resp) {
        throw new Error("No quizzes specified")
    }
    if (resp.toLowerCase() !== 'none') {
        classD.quiz = resp;
        isAccountable = true;
    }

    discipline.setClassD(classD);

    return isAccountable;
}

async function askClassE (message, user, settings, discipline, hasAccountability) {
    if (!hasAccountability) {
        var duration = await message.awaitReply(`:question: **Mute**: If a mute should be issued, specify how long the mute should be in hours. Use "0" for indefinite / until staff remove it. Specify "none" if no mute is to be issued. You have 10 minutes to respond.`, 600000);
        if (!duration) {
            throw new Error("No mute specified")
        }
        if (duration.toLowerCase() !== 'none') {
            if (isNaN(parseInt(duration))) {
                await message.channel.send(`:x: An invalid number was provided. We will assume 1 hour.`);
                duration = 1;
            }
            duration = parseInt(duration);
            discipline.setMuteDuration(duration);
        }
    }

    var resp = await message.awaitReply(`:question: **Text Channel Restrictions**: If this user should be denied access to one or more text channels, tag all of the channels they should be removed from using # and Discord channel tagging. Specify "none" to not restrict the user from any text channels. You have 10 minutes to respond.`, 600000);
    if (!resp) {
        throw new Error("No channel restrictions specified")
    }
    if (resp.toLowerCase() !== 'none') {
        discipline.addChannelRestrictions(resp);
    }

    var resp = await message.awaitReply(`:question: **Bot Restrictions**: Add one or more of the following bot restrictions to the member, or type "none" to add none of them (separate each restriction with a space; type exactly as it appears case sensitive; you have 10 minutes to respond): ${Object.keys(settings.restrictions).join(", ")}`, 600000);
    if (!resp) {
        throw new Error("No bot restrictions specified")
    }
    if (resp.toLowerCase() !== 'none') {
        discipline.addBotRestrictions(resp.split(" "));
    }

    var resp = await message.awaitReply(`:question: **Add Restrictive Roles**: If this user should be awarded roles, such as ones that restrict certain permissions, mention each role that should be applied to them. Do not add the muted role to the user; this is added automatically when necessary. Specify "none" to not add any roles to the user. You have 10 minutes to respond.`, 600000);
    if (!resp) {
        throw new Error("No roles specified")
    }
    if (resp.toLowerCase() !== 'none') {
        discipline.addPermissions(resp);
    }

}

async function askClassF (message, discipline) {
    var duration = await message.awaitReply(`:question: **Ban**: How long, in days, should the ban last? Specify 0 for a permanent ban. You have 10 minutes to respond.`, 600000);
    if (!duration) {
        throw new Error("No ban specified")
    }
    if (isNaN(parseInt(duration))) {
        await message.channel.send(`:x: An invalid number was provided. We will assume 3 days.`);
        duration = 3;
    }
    duration = parseInt(duration);
    discipline.setBanDuration(duration);

    return duration === 0;
}

async function askWillMute (message, discipline) {
    var willMute = await message.ask(`:question: **Initial Mute**: Are you going to either issue a mute, or require the user to complete an apology / research paper / retraction statement / quiz?`);
    if (willMute)
        discipline.setMuteDuration(0);
}

async function askClassF (message, discipline) {
    var willBan = await message.ask(`:warning: **Are you sure you want to issue a ban?**: You have 1 minute to respond. This member does not qualify for a ban because they still have HP. You are only allowed to issue a ban if this user violated the zero tolerance policy. Issuing bans otherwise may be considered staff abuse and could result in staff discipline.`);
    if (willBan)
        return true;
    return false;
}