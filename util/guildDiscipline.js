// This class constructs and issues a discipline against a guild member via the user extension
const ModLog = require('./modLog');
const moment = require('moment');
const { MessageEmbed } = require('discord.js');

module.exports = class GuildDiscipline {

    constructor(user, guild, responsible) {
        this.client = guild.client;
        this.user = user;
        this.guild = guild;
        this.responsible = responsible;
        this.reason = `No reason specified; please contact staff of ${guild.name}`;
        this.xp = 0;
        this.yang = 0;
        this.HPDamage = 0;
        this.channelRestrictions = [];
        this.botRestrictions = [];
        this.permissions = [];
        this.classD = {
            apology: false,
            research: false,
            retraction: false,
            quiz: false
        }
        this.other = null;
        this.muteDuration = null;
        this.banDuration = null;
        this.type = 'classA';
        this.channel;
        this.message;
        this.rules = [];
        this.case = Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97);
    }

    setReason (reason = null) {
        if (reason instanceof Array)
            reason = reason.join('; ');
        this.reason = reason;
        return this;
    }

    setXp (xp) {
        this.xp = xp;
        return this;
    }

    setYang (yang) {
        this.yang = yang;
        return this;
    }

    setHPDamage (damage) {
        this.HPDamage = damage;
        return this;
    }

    setOther (other = null) {
        if (other instanceof Array)
            other = other.join('; ');
        this.other = other;
        return this;
    }

    setMuteDuration (hours) {
        this.muteDuration = hours;
        return this;
    }

    setBanDuration (days) {
        this.banDuration = days;
        return this;
    }

    setType (type) {
        this.type = type;
        return this;
    }

    addRule (number) {
        this.rules.push(number);
        return this;
    }

    addChannelRestrictions (messageContent) {
        var regex = /(?:<#)?(\d{17,19})>?/g
        var snowflake;
        while ((snowflake = regex.exec(messageContent)) !== null) {
            this.channelRestrictions.push(snowflake[ 1 ]);
        }
        return this;
    }

    addPermissions (messageContent) {
        var regex = /(?:<@&)?(\d{17,19})>?/g
        var snowflake;
        while ((snowflake = regex.exec(messageContent)) !== null) {
            this.permissions.push(snowflake[ 1 ]);
        }
        return this;
    }

    setClassD (classD) {
        this.classD = classD;
        return this;
    }

    addBotRestrictions (restrictions) {
        this.botRestrictions = restrictions;
        return this;
    }

    // prepare the discipline while the staff is still going through the wizard.
    async prepare () {
        // Get the configured muted role
        const muted = this.guild.settings.muteRole;
        const mutedRole = this.guild.roles.resolve(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        var guildMember = this.guild.members.resolve(this.user.id);

        // Create an incidents channel if configuration permits
        const incidents = this.guild.settings.incidentsCategory;
        if (incidents) {
            // Create an incidents channel between the muted user and staff, first grant permissions for the user
            var overwrites = [];
            if (guildMember) {
                overwrites.push({
                    id: guildMember.id,
                    allow: [
                        "ADD_REACTIONS",
                        "VIEW_CHANNEL",
                        "SEND_MESSAGES",
                        "EMBED_LINKS",
                        "ATTACH_FILES",
                        "READ_MESSAGE_HISTORY"
                    ],
                    type: 'member'
                });
            }

            // Add deny permissions for @everyone
            overwrites.push({
                id: this.guild.roles.everyone,
                deny: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            });

            // Process permission overwrites for staff
            if (this.guild.settings.modRole) {
                overwrites.push({
                    id: this.guild.settings.modRole,
                    allow: [
                        "ADD_REACTIONS",
                        "VIEW_CHANNEL",
                        "SEND_MESSAGES",
                        "MANAGE_MESSAGES",
                        "MENTION_EVERYONE",
                        "MANAGE_ROLES",
                        "EMBED_LINKS",
                        "ATTACH_FILES",
                        "READ_MESSAGE_HISTORY"
                    ],
                    type: 'role'
                });
            }

            var response = `:hourglass_flowing_sand: ${this.user.tag}, Staff are filling out an incident report regarding something you recently did in the guild. More information will be provided to you in a few minutes as staff finish the incident report. **Leaving the guild will not avert discipline. Furthermore, you will lose the privilege to appeal discipline if you leave.**`

            if (this.type === 'classC' || this.type === 'classD' || (this.type === 'classE' && this.muteDuration !== null) || this.type === 'classF' || this.type === 'classG') {
                // Add the mute role to the user, if the user is in the guild
                if (guildMember) {
                    guildMember.roles.add(mutedRole, this.reason);
                } else {
                    var settings = await this.user.guildSettings(this.guild.id);
                    // Otherwise, set muted to true manually
                    settings.update(`muted`, true, this.guild);
                }

                response += "\n\n" + `**You have been muted in the guild for the time being for the safety of the community.**`
            }


            // Create the incidents channel
            this.channel = await this.guild.channels.create(`discipline-${this.case}`, {
                type: 'text',
                topic: `Discipline ${this.user.id} (${this.user.username}#${this.user.discriminator}), responsible mod: ${this.responsible.username}#${this.responsible.discriminator}`,
                parent: incidents,
                permissionOverwrites: overwrites,
                rateLimitPerUser: 15,
                reason: `Discipline ${this.user.username}#${this.user.discriminator}, responsible mod: ${this.responsible.username}#${this.responsible.discriminator}`
            });

            // Send an initial message to the channel
            this.message = await this.channel.send(response);
        }

        return this;
    }

    // Execute when the discipline wizard has been completed by staff
    async finalize () {
        // Get the configured muted role
        const muted = this.guild.settings.muteRole;
        const mutedRole = this.guild.roles.resolve(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        var guildMember = this.guild.members.resolve(this.user.id);

        // Init the message
        var msg = new MessageEmbed()
            .setAuthor(`Responsible Staff Member: ${this.responsible.tag}`)
            .setColor(colour(this.type))
            .setURL(`${this.client.options.dashboardHooks.origin}/modlogs.html?user=${this.user.id}`);

        // Set up a function called for class D discipline and higher
        var classD = () => {
            // No class D discipline if we are issuing a permanent ban
            if (this.banDuration === 0) {
                this.classD = {
                    apology: false,
                    research: false,
                    retraction: false,
                    quiz: false
                }
            }

            // Check to ensure at least one class D discipline was specified
            if (this.classD.apology || this.classD.research || this.classD.retraction || this.classD.quiz) {
                // Format the mute depending on whether or not a temp ban is issued
                if (this.banDuration === null) {
                    this.muteDuration = 0;
                    msg.addField(`:clipboard: **You are required to complete tasks**`, `This notice includes one or more required tasks for you to complete. Please note the following:` + "\n" + `---You are muted in the guild until all tasks have been completed / satisfied.` + "\n" + `---**You have 7 days to complete all tasks** unless otherwise mentioned. Otherwise, you will be kicked from the guild, but you are free to return once you completed your tasks.`);
                } else {
                    msg.addField(`:clipboard: **You are required to complete tasks when you return to the guild**`, `This notice includes one or more required tasks for you to complete once you return to the guild from your temporary ban. Please note the following:` + "\n" + `---You are muted in the guild. Once you return after your temporary ban, you will remain muted until all tasks are completed / satisfied.` + "\n" + `---**You will have 7 days to complete all tasks from the time you return to the guild after your ban** unless otherwise mentioned. Otherwise, you will be kicked from the guild, but you are free to return once you completed your tasks.`);
                }
                // No class D discipline, but a mute was specified? Make a mute discipline message based on duration.
            } else if (this.muteDuration !== null) {
                msg.addField(`:mute: **You have been muted until ${this.muteDuration === 0 ? `staff unmute you` : `${moment().add(this.muteDuration, 'hours').format("LLLL Z")}`}**`, `You will not have access to any of the guild channels (except this) nor members (except staff) until the mute is removed or expired.`);
            }

            // Make messages depending on class D discipline specified.
            if (this.classD.apology) {
                msg.addField(`:sweat_smile: **You must write one or more apologies**`, this.classD.apology);
                msg.addField(`Apology requirements (each)`, `---No less than 250 words long.` + "\n" + `---Must acknowledge you did wrong, state what you did wrong, mention how your behavior impacted the members/community, what you learned, and what you will do to ensure this does not happen again.` + "\n" + `---May not contain excuses, justifications, nor defensive language.` + "\n" + `---Post completed apologies in this channel as an attachment or link to an online document. You will then be required with staff guidance to present your apologies directly to addressed members.`);
            }

            if (this.classD.research) {
                msg.addField(`:pencil: **You must write one or more research papers**`, this.classD.research);
                msg.addField(`Research Paper requirements (each)`, `---No less than 500 words long.` + "\n" + `---Must contain an introduction / thesis, body (supporting details, facts, and evidence), and conclusion (what you learned and how you will apply this knowledge).` + "\n" + `---Must have at least 2 credible sources cited (ask staff for help on what is deemed "credible").` + "\n" + `---Post completed research papers in this channel as an attachment or link to an online document. You might additionally be required with staff guidance to present your research to the guild.`);
            }

            if (this.classD.retraction) {
                msg.addField(`:page_facing_up: **You must write one or more retraction statements**`, this.classD.retraction);
                msg.addField(`Retraction Statement requirements (each)`, `---No less than 250 words long.` + "\n" + `---Must contain an introduction (what you originally said, and acknowledgment that it was wrong / inaccurate), body (the correct facts and evidence / citations to support that), and conclusion (what you learned and how you will apply this knowledge).` + "\n" + `---Must have at least 2 credible sources cited (ask staff for help on what is deemed "credible").` + "\n" + `---Post completed retraction statements in this channel as an attachment or link to an online document. You will then be required with staff guidance to present your retraction statements to the guild.`);
            }

            if (this.classD.quiz) {
                msg.addField(`:question: **You must take and pass one or more quizzes**`, this.classD.quiz);
            }
        }

        // Update the incidents channel with relevant information
        if (this.message)
            await this.message.delete();
        switch (this.type) {
            case 'classA':
                this.muteDuration = null;
                this.banDuration = null;
                msg.setTitle(`:warning: **__FORMAL WARNING__** :warning:`);
                msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/warning.png`);
                msg.setDescription(`We are concerned about your recent conduct. Please read this information carefully. Future incidents can result in discipline. You may ask staff any questions you have, or to help you develop an action plan to avoid these incidents in the future, in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this warning because you were not in the guild at the time the warning was issued.` :  `🔄 You have 48 hours to appeal this warning in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                break;
            case 'classB':
                this.muteDuration = null;
                this.banDuration = null;
                msg.setTitle(`:octagonal_sign: **__NOTICE OF DISCIPLINARY ACTION__** :octagonal_sign:`);
                msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/discipline.png`);
                msg.setDescription(`You have recently violated our rules and have been issued basic discipline. Please read the following information carefully. You may ask questions or request help to develop an action plan in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                break;
            case 'classC':
                if (this.banDuration === null && this.muteDuration !== null) {
                    msg.setTitle(`:mute: **__NOTICE OF ANTISPAM MUTE__** :mute:`);
                    msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/mute.png`);
                    msg.setDescription(`You have been muted by the automatic antispam system. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                    msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if the bot did not give you a mentioned warning before antispam disciplining you (you cannot appeal for any other reason). Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                } else if (this.banDuration > 0) {
                    msg.setTitle(`:no_entry: **__NOTICE OF ANTISPAM TEMPORARY BAN__** :no_entry:`);
                    msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/tempban.png`);
                    msg.setDescription(`You have been temporarily banned by the automatic antispam system. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                    msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if the bot did not give you a mentioned warning before antispam disciplining you (you cannot appeal for any other reason). Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                } else if (this.banDuration === 0) {
                    msg.setTitle(`:no_entry_sign: **__NOTICE OF ANTISPAM PERMANENT BAN__** :no_entry_sign:`);
                    msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/ban.png`);
                    msg.setDescription(`You have been permanently banned by the automatic antispam system. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                    msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if the bot did not give you a mentioned warning before antispam disciplining you (you cannot appeal for any other reason). Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                }

                break;
            case 'classD':
                this.muteDuration = 0;
                this.banDuration = null;
                msg.setTitle(`:notebook: **__NOTICE OF REFLECTION / RESEARCH REQUIREMENTS__** :notebook:`);
                msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/assignment.png`);
                msg.setDescription(`You have recently violated our rules. We need you to complete one or more tasks to be allowed participation again in the guild. Please read the following information carefully. You may ask questions or request help in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                break;
            case 'classE':
                this.banDuration = null;
                msg.setTitle(`:closed_lock_with_key: **__NOTICE OF RESTRICTIONS__** :closed_lock_with_key:`);
                msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/restrictions.png`);
                msg.setDescription(`Due to the nature of your recent rule violations, we had to issue restrictions on you to protect the safety and integrity of the guild. Please read the following information carefully. You may ask questions or request help in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                break;
            case 'classF':
                this.muteDuration = null;

                if (this.banDuration === 0) {
                    msg.setTitle(`:no_entry_sign: **__NOTICE OF PERMANENT BAN__** :no_entry_sign:`);
                    msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/ban.png`);
                    msg.setDescription(`Your conduct has caused irreversible harm to our community. You are required to leave indefinitely for the safety and integrity of the community. Please read the following information carefully. You may ask questions in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                    msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                } else {
                    msg.setTitle(`:no_entry: **__NOTICE OF TEMPORARY BAN__** :no_entry:`);
                    msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/tempban.png`);
                    msg.setDescription(`Your conduct has caused significant problems in the community. You are required to leave for a temporary time to reflect on, and improve, your behavior. Please read the following information carefully. You may ask questions or request help to develop an action plan in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                    msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` :  `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
                }
                break;
            case 'classG':
                this.muteDuration = 0;
                this.banDuration = null;
                msg.setTitle(`:mag: **__NOTICE OF INVESTIGATIVE MUTE__** :mag:`);
                msg.setThumbnail(`${this.client.options.dashboardHooks.origin}/discipline/ban.png`);
                msg.setDescription(`Your recent conduct necessitates an investigation by a third party, such as Discord or law enforcement. You have been muted during the investigation. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${this.rules.join(", ")}` + "\n" + `${this.reason}`);
                msg.setFooter(`💬 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `👮 **You must comply with staff's questions and instruction, and provide only truthful information**. Failure will result in a permanent ban. The only acceptable forms of civil disobedience is polite refusal to answer questions, remaining silent, or leaving the guild.` + "\n" + `😄 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${this.case}`);
        }

        // Get settings

        var settings = await this.user.guildSettings(this.guild.id);

        // prepare a modLog
        var modLog = new ModLog(this.guild)
            .setType(this.type)
            .setModerator(this.responsible)
            .setUser(this.user)
            .setReason(this.reason)
            .setDiscipline({
                xp: this.xp,
                yang: this.yang,
                HPDamage: this.HPDamage,
                schedule: null
            })
            .setChannelRestrictions(this.channelRestrictions)
            .addBotRestrictions(this.botRestrictions)
            .setPermissions(this.permissions)
            .setClassD(this.classD)
            .setRules(this.rules)
            .setOtherDiscipline(this.other)
            .setMuteDuration(this.muteDuration)
            .setBanDuration(this.banDuration)
            .setCase(this.case);

        // Bans
        if (this.banDuration !== null) {
            if (this.banDuration === 0) {
                msg.addField(`:no_entry_sign: **You have been permanently banned**`, `You are no longer welcome here and are required to leave indefinitely. We hope you enjoyed your stay and wish you luck in your journey.` + "\n" + `Once you leave the guild, a ban will be placed on you. This ban will remain in place indefinitely or until staff manually remove it. Until you leave or staff kick you, you will remain muted.`)
            } else {
                msg.addField(`:no_entry: **You have been temporarily banned for ${this.banDuration} days**`, `You are required to leave the guild and reflect on, and improve, your behavior.` + "\n" + `Once you leave the guild, a ban will be placed on you, which will be removed by the bot in ${this.banDuration} days. Your temp-ban time will not begin until you leave the guild or get kicked; until then, you will remain muted.`);
            }
        }

        // Add a schedule if a mute is in place
        if (this.muteDuration !== null && this.muteDuration > 0) {
            const removemute = await this.client.schedule.create('removemute', moment().add(this.muteDuration, 'hours').toDate(), {
                data: {
                    user: this.user.id,
                    guild: this.guild.id,
                    role: mutedRole.id,
                    caseID: this.case
                }
            });
            modLog.setDiscipline({
                xp: this.xp,
                yang: this.yang,
                HPDamage: this.HPDamage,
                schedule: removemute.id
            });
            modLog.setExpiration(moment().add(this.muteDuration, 'hours').toISOString(true));
        }

        // Issue discipline

        // First, channel restrictions
        if (this.channelRestrictions.length > 0) {
            var channelNames = [];
            this.channelRestrictions.map(channel => {
                var theChannel = this.guild.channels.resolve(channel)

                if (theChannel) {
                    channelNames.push(theChannel.name);
                    theChannel.createOverwrite(this.user, {
                        VIEW_CHANNEL: false
                    }, `Discipline case ${this.case}`);
                }
            })
            msg.addField(`:lock_with_ink_pen: **You have been removed from one or more channels**`, `You can no longer access the following channels indefinitely: ${channelNames.join(", ")}`);
        }

        // Next, add restriction permissions
        if (this.permissions.length > 0) {
            var roleNames = [];
            this.permissions.map((permission, index) => {
                var theRole = this.guild.roles.resolve(permission)

                if (theRole) {
                    roleNames.push(theRole.name);
                    if (guildMember) {
                        guildMember.roles.add(theRole, `Discipline case ${this.case}`);
                    } else {
                        settings.update(`roles`, theRole, this.guild, { action: 'add' });
                    }
                } else {
                    this.permissions.splice(index, 1);
                }
            })
            modLog = modLog.setPermissions(this.permissions);
            msg.addField(`:closed_lock_with_key: **Restrictive roles were added to you**`, `These roles have been added to you: ${roleNames.join(", ")}`);
        }

        // Next, add bot restrictions
        if (this.botRestrictions.length > 0) {
            this.botRestrictions.map((restriction, index) => {
                if (Object.keys(settings.restrictions).indexOf(restriction) !== -1) {
                    settings.update(`restrictions.${restriction}`, true);

                    if (restriction === 'cannotUseVoiceChannels' && guildMember) {
                        guildMember.voice.setDeaf(true, 'User disciplined with cannotUseVoiceChannels restriction.');
                        guildMember.voice.setMute(true, 'User disciplined with cannotUseVoiceChannels restriction.');
                    }
                } else {
                    this.botRestrictions.splice(index, 1);
                }
            });
            modLog = modLog.addBotRestrictions(this.botRestrictions);
            msg.addField(`:lock: **You were issued bot-level restrictions**`, `These bot restrictions have been applied to you (ask staff if you need clarification on what they do): ${this.botRestrictions.join(", ")}`);
        }

        // Check class D discipline
        classD();

        if (this.xp > 0) {
            msg.addField(`:fleur_de_lis: **${this.xp} XP has been retracted from you**`, `You now have ${(settings.xp - this.xp)} XP.`);
            await settings.update(`xp`, (settings.xp - this.xp));
            // Update level roles
            var guildMember = this.guild.members.resolve(this.user);
            if (guildMember) {
                var levelRoles = {};
                var levelRoles2 = guildMember.guild.settings.levelRoles;
                for (var key in levelRoles2) {
                    if (levelRoles2.hasOwnProperty(key)) {
                        if (levelRoles2[ key ] === null)
                            continue;
                        levelRoles[ key.replace('level', '') ] = levelRoles2[ key ];
                    }
                }
                var levelKeys = Object.keys(levelRoles);
                if (levelKeys.length > 0) {
                    var rolesToAdd = [];
                    var rolesToRemove = [];
                    levelKeys.map(levelKey => {
                        var xp = Math.ceil(((levelKey - 1) / 0.177) ** 2);
                        if (guildMember.guild.roles.has(levelRoles[ levelKey ])) {
                            if (guildMember.settings.xp >= xp && !guildMember.roles.has(levelRoles[ levelKey ])) {
                                rolesToAdd.push(levelRoles[ levelKey ]);
                            } else if (guildMember.settings.xp < xp && guildMember.roles.has(levelRoles[ levelKey ])) {
                                rolesToRemove.push(levelRoles[ levelKey ]);
                            }
                        }
                    });

                    if (rolesToAdd.length > 0)
                        guildMember.roles.add(rolesToAdd, `Level Update (add roles)`)
                            .then(stuff => {
                                if (rolesToRemove.length > 0)
                                    guildMember.roles.remove(rolesToRemove, `Level Update (remove roles)`);
                            });
                }
            }
        }
        if (this.yang > 0) {
            msg.addField(`:gem: **You were fined ${this.yang} Yang**`, `You now have ${(settings.yang - this.yang)} Yang.`);
            await settings.update(`yang`, (settings.yang - this.yang));
        }
        if (this.HPDamage > 0) {
            var HP = await this.user.HP(this.guild.id);
            HP = HP - this.HPDamage;
            if (HP <= 0) {
                msg.addField(`:broken_heart: **You were given ${this.HPDamage} HP damage**`, `You now have 0 HP.` + "\n" + `:warning: **You do not have any HP left!** This means any additional rule violations can result in a temporary or permanent ban at staff discretion.`);
            } else {
                msg.addField(`:broken_heart: **You were given ${this.HPDamage} HP damage**`, `You now have ${HP} HP.` + "\n" + `Bans are not considered / issued except for violations of the zero tolerance policy unless you lose all your HP. You will regenerate 1 HP for every ${this.guild.settings.oneHPPerXP} XP you earn.`);
            }
            await settings.update(`HPDamage`, (settings.HPDamage + this.HPDamage));
        }
        if (this.other !== null) {
            msg.addField(`:notepad_spiral: **Additional information or discipline has been provided**`, this.other);
        }

        // If the member is no longer in the guild, issue the ban or tempban immediately, and undo the mute
        if (!guildMember) {
            if (this.banDuration !== null) {
                await this.guild.members.ban(this.user, { days: 7, reason: this.reason });
                if ((!this.classD.apology && !this.classD.research && !this.classD.retraction && !this.classD.quiz) || this.banDuration === 0) {
                    settings.update(`muted`, false, this.guild);
                }
                if (this.banDuration > 0) {
                    // Add a schedule if the mute is limited duration
                    const removeban = await this.client.schedule.create('removeban', moment().add(this.banDuration, 'days').toDate(), {
                        data: {
                            user: this.user.id,
                            guild: this.guild.id,
                            incidentsChannel: (this.channel !== null && this.channel.id) ? this.channel.id : null
                        }
                    });
                    modLog.setDiscipline({
                        xp: this.xp,
                        yang: this.yang,
                        HPDamage: this.HPDamage,
                        schedule: removeban.id
                    });
                    modLog.setExpiration(moment().add(this.banDuration, 'days').toISOString(true));
                }
            }
        }

        // Add raid score depending on type of discipline
        switch (this.type) {
            case 'classA':
            case 'classB':
                this.guild.raidScore(10);
                break;
            case 'classC':
            case 'classD':
            case 'classE':
                this.guild.raidScore(20);
                break;
            case 'classF':
            case 'classG':
                this.guild.raidScore(30);
                break;
        }

        modLog = modLog.setChannel(this.channel)

        // Push out the mod log
        modLog = await modLog.send();

        if (guildMember && this.banDuration !== null) {
            if (this.banDuration > 0)
                await this.guild.settings.update('pendSuspensions', { user: this.user.id, reason: this.reason, duration: this.duration, channel: this.channel.id, case: modLog }, { action: 'add' });
            if (this.banDuration === 0)
                await this.guild.settings.update('pendBans', { user: this.user.id, reason: this.reason, channel: this.channel.id, case: modLog }, { action: 'add' });
        }

        // Push out discipline message
        this.channel.send((this.user ? `<@${this.user.id}>, you have been issued a disciplinary notice. It is posted as an embed below.
If you cannot see the information below, please go in your Discord settings -> App Settings -> Text & Images, and enable the __Show website preview info from links pasted into chat__ option.` : ``), {
            split: true,
            embed: msg
        });

        return this;
    }

    // Called when the staff member fails to complete the wizard
    async cancel () {
        // Get the configured muted role
        const muted = this.guild.settings.muteRole;
        const mutedRole = this.guild.roles.resolve(muted);
        var settings = await this.user.guildSettings(this.guild.id);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        // Remove the mute role
        var guildMember = this.guild.members.resolve(this.user.id);

        if (this.type === 'classC' || this.type === 'classD' || (this.type === 'classE' && this.muteDuration !== null) || this.type === 'classF' || this.type === 'classG') {
            if (guildMember) {
                guildMember.roles.remove(mutedRole, `Staff did not complete discipline wizard.`);
            } else {
                // Otherwise, remove mutedRole to the list of roles for the user so it's applied when/if they return
                settings.update(`muted`, false, this.guild);
            }
        }
        if (this.message)
            await this.message.delete();
        if (this.channel)
            await this.channel.send(`:ok_hand: The staff member who was working on your discipline has decided against taking any action. We apologize for any inconvenience this caused you. If you were muted, the mute was removed.`);
        return this;
    }

};

function colour (type) {
    switch (type) {
        case 'classF':
            return "#dc3545";
        case 'classC':
            return '#17a2b8';
        case 'classA':
            return "#ffc107";
        case 'classE':
            return "#ff851b";
        case 'classD':
            return "#605ca8";
        case 'classB':
            return "#007bff";
        case 'classG':
            return "#f012be";
        default:
            return "#ffffff";
    }
}
