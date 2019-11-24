// This class constructs and issues a discipline against a guild member via the user extension
const ModLog = require('./modLog');
const moment = require('moment');

module.exports = class GuildDiscipline {

    constructor(user, guild, responsible) {
        this.client = guild.client;
        this.user = user;
        this.guild = guild;
        this.responsible = responsible;
        this.reason = `No reason specified; please contact staff of ${guild.name}`;
        this.xp = 0;
        this.yang = 0;
        this.reputation = 0;
        this.channelRestrictions = [];
        this.permissions = [];
        this.classD = {
            apology: null,
            research: null,
            retraction: null
        }
        this.other = null;
        this.muteDuration = null;
        this.banDuration = null;
        this.type = 'classA';
        this.channel = null;
        this.message = null;
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

    setReputation (reputation) {
        this.reputation = reputation;
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

            var response = `:hourglass_flowing_sand: <@${this.user.id}>, staff are filling out an incident report regarding something you recently did in the guild. More information will be provided to you shortly; please wait while staff finish telling me all the information to pass to you.`

            if (this.type === 'classC' || this.type === 'classD' || (this.type === 'classE' && this.muteDuration !== null) || this.type === 'classF' || this.type === 'classG') {
                // Add the mute role to the user, if the user is in the guild
                if (guildMember) {
                    guildMember.roles.add(mutedRole, this.reason);
                } else {
                    // Otherwise, add mutedRole to the list of roles for the user so it's applied when/if they return
                    this.user.guildSettings(this.guild.id).update(`roles`, mutedRole, this.guild, { action: 'add' });
                }

                response += "\n\n" + `**You have been muted in the guild for the time being for the safety of the community.**`
            }


            // Create the incidents channel
            this.channel = await this.guild.channels.create(`discipline_${this.case}`, {
                type: 'text',
                topic: `Discipline ${this.user.username}#${this.user.discriminator}, responsible mod: ${this.responsible.username}#${this.responsible.discriminator}`,
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
        var msg = ``; // Intro / reason
        var msg2 = "The following discipline has been issued: \n\n"; // Discipline / Accountability
        var msg3 = ``; // Appeals / Closing / not in the guild

        // Set up a function called for class D discipline and higher
        var classD = () => {
            // No class D discipline if we are issuing a permanent ban
            if (this.banDuration === 0) {
                this.classD = {
                    apology: null,
                    research: null,
                    retraction: null
                }
            }

            // Check to ensure at least one class D discipline was specified
            if (this.classD.apology !== null || this.classD.research !== null || this.classD.retraction !== null) {
                // Format the mute depending on whether or not a temp ban is issued
                if (this.banDuration === null) {
                    this.muteDuration = 0;
                    msg2 += "**Mute** \n"
                    msg2 += `You have been muted from the guild until you complete the tasks outlined in this discipline section. Once all tasks are satisfied, your mute will be lifted. If you choose not to do the tasks, you will remain muted until / unless you do them.` + "\n\n"
                } else {
                    msg2 += "**Mute on Return** \n"
                    msg2 += `Once you return to the guild, you will be muted until you complete the tasks outlined in this discipline section. Once all tasks are satisfied, your mute will be lifted. If you choose not to do the tasks, you will remain muted until / unless you do them.` + "\n\n"
                }
                // No class D discipline, but a mute was specified? Make a mute discipline message based on duration.
            } else if (this.muteDuration !== null) {
                msg2 += "**Mute** \n"
                msg2 += `You have been muted from the guild ${this.muteDuration === 0 ? 'until staff manually remove the muted role from you. You will not have access to the rest of the guild until the mute is removed.' + "\n\n" : `until ${moment().add(this.muteDuration, 'hours').format("LLLL Z")}`} (${this.muteDuration} hours from now). You will not have access to the rest of the guild until the mute expires.` + "\n\n"
            }

            // Make messages depending on class D discipline specified.
            if (this.classD.apology !== null) {
                msg2 += "**Task: Formal, Reflective Apologies** \n"
                msg2 += `You are required to write formal reflective apologies addressed to each of the following people: **${this.classD.apology}**.
:small_blue_diamond: Each apology must be no less than 250 words long.
:small_blue_diamond: You must state in each apology what you did wrong, that you acknowledge you did wrong, how your actions negatively impacted the person and/or the community, what you learned from this experience, and what you will do to ensure this doesn't happen again.
:small_blue_diamond: Apologies __may not__ contain excuses, justifications, nor defenses. This apology is about the people affected, not you.
Post your completed apologies in this text channel as an attachment of file type ODT, DOC/DOCX, RTF, TXT, or PDF. Once approved, staff will add the responsible members to this chat, and you will be required to present your apologies to those people (the staff will not do it; you must do it since you're the responsible one). After doing that, this task will be satisfied.` + "\n\n"
            }

            if (this.classD.research !== null) {
                msg2 += "**Task: Research Paper** \n"
                msg2 += `You are required to write a research paper on each of the following topics: **${this.classD.research}**
:small_blue_diamond: Each research paper must be no less than 1,000 words long (about one page each of 12-point font)
:small_blue_diamond: Each research paper must contain an introduction (thesis / main points), body (supporting details / evidence / sources to back the points stated in the introduction), and conclusion (what you learned by doing this research, and how you will apply this research to your life and how you conduct yourself).
:small_blue_diamond: Each paper must contain at least 2 cited credible sources to demonstrate you actually did the research on the provided topics.
Post your completed research paper(s) in this text channel as an attachment of file type ODT, DOC/DOCX, RTF, TXT, or PDF. Once staff approve your papers, this task is satisfied.` + "\n\n"
            }

            if (this.classD.retraction !== null) {
                msg2 += "**Task: Retraction Statement** \n"
                msg2 += `You are required to write a retration statement retracting the following things you posted / said: **${this.classD.retraction}**
:small_blue_diamond: Each retraction statement must be no less than 250 words long.
:small_blue_diamond: Each retraction statement must include an introduction (what you originally said, and statement that it was wrong and you retract it), body (the correct information and evidence / sources), and conclusion (what you learned by doing this research / retraction, and what you will do to ensure you fact-check yourself in the future)
:small_blue_diamond: Each retraction statement must contain at least 2 cited credible sources to act as evidence that your corrected information is indeed correct.
Post your completed retraction statement(s) in this text channel as an attachment of file type ODT, DOC/DOCX, RTF, TXT, or PDF. Once staff approve your statements, you will be required to present your statement(s) to the rest of the guild. Once you do, this task is satisfied.` + "\n\n"
            }
        }

        // Update the incidents channel with relevant information
        if (this.message !== null)
            await this.message.delete();
        switch (this.type) {
            case 'classA':
                this.muteDuration = null;
                this.banDuration = null;
                msg += ":warning: **__FORMAL WARNING ISSUED__ (Class A)** :warning: \n\n"
                msg += "Staff are concerned about your recent conduct. You are being issued a formal warning for the following: \n"
                msg += `**Rule number(s) violated:** ${this.rules.join(", ")}` + "\n"
                msg += `**Further Information:** ${this.reason}` + "\n\n"
                msg += "Staff would like to see you work on this concern and learn from this encounter. Further violations will likely result in discipline."

                msg2 = ""

                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this warning in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this warning final and unappealable. \n"
                msg3 += "Thank you for your understanding and cooperation."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add permissions to this channel if/when I detect them re-entering the guild."

                break;
            case 'classB':
                this.muteDuration = null;
                this.banDuration = null;
                msg += ":octagonal_sign: **__DISCIPLINE ISSUED__ (Class B)** :octagonal_sign: \n\n"
                msg += "Come on, friend. We know you can behave better than this. Your recent conduct has necessitated disciplinary action. You are being issued discipline for the following: \n"
                msg += `**Rule number(s) violated:** ${this.rules.join(", ")}` + "\n"
                msg += `**Further Information:** ${this.reason}` + "\n\n"
                msg += "Staff would like to see you work on this concern and learn from this encounter. Staff may need to issue more severe discipline if this happens again."

                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this discipline in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable. \n"
                msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                msg3 += "**Staff**: Do not delete this channel until the appeal deadline has passed, or an appeal has been granted or denied. Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add permissions to this channel if/when I detect them re-entering the guild."

                break;
            case 'classC':
                if (this.banDuration === null && this.muteDuration !== null) {
                    msg += ":mute: **__ANTISPAM MUTE ISSUED__ (Class C)** :mute: \n\n"
                    msg += "You ignored my antispam warning. In order to stop excessive spam, I have issued a mute against you."

                    msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                    msg3 += "**You have 48 hours to dispute this discipline in this text channel if I did not warn you before issuing antispam discipline**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable. \n"
                    msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                    msg3 += "**Staff**: Do not delete this channel until the appeal deadline has passed, or an appeal has been granted or denied. Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."

                    if (!guildMember)
                        msg3 += "\n\n**User not in the guild**\nI will add the mute and permissions to this channel if/when I detect them re-entering the guild."
                } else if (this.banDuration > 0) {
                    msg += ":no_entry: **__ANTISPAM TEMPORARY BAN ISSUED__ (Class C)** :no_entry: \n\n"
                    msg += "You ignored my antispam warning during an active raid. I have issued a temporary ban against you to mitigate the raid."

                    msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                    msg3 += "**You have 48 hours to dispute this discipline in this text channel if I did not warn you before issuing antispam discipline**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable. \n"
                    msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                    msg3 += "**Staff**: Do not delete this channel until the appeal deadline has passed, or an appeal has been granted or denied. Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."
                    if (!guildMember)
                        msg3 += "\n\n**User not in the guild**\nThe temp ban was applied immediately."
                } else if (this.banDuration === 0) {
                    msg += ":no_entry_sign: **__ANTISPAM PERMANENT BAN ISSUED__ (Class C)** :no_entry_sign: \n\n"
                    msg += "You ignored my antispam warning during an active severe raid. I have issued a permanent ban against you to mitigate the raid. You are asked to leave the guild and not to return. We wish you the best in your adventures and hope you enjoyed your stay in this guild."

                    msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                    msg3 += "**You have 48 hours to dispute this discipline in this text channel if I did not warn you before issuing antispam discipline**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable. \n"
                    msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                    msg3 += "**Staff**: Do not delete this channel until the appeal deadline has passed, or an appeal has been granted or denied. Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."
                    if (!guildMember)
                        msg3 += "\n\n**User not in the guild**\nThe ban was applied immediately."
                }

                break;
            case 'classD':
                this.muteDuration = 0;
                this.banDuration = null;
                msg += ":mute: **__ACCOUNTABILITY MUTE ISSUED__ (Class D)** :mute: \n\n"
                msg += "The staff are disappointed in your recent conduct. Your behavior has caused problems for other members, and we are issuing a mute until you complete a task or two as reflection / accountability for your actions. You are being issued a mute for the following: \n"
                msg += `**Rule number(s) violated:** ${this.rules.join(", ")}` + "\n"
                msg += `**Further Information:** ${this.reason}` + "\n\n"

                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this discipline in this text channel**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable. \n"
                msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                msg3 += "**Staff**: Do not delete this channel until either an appeal has been granted, the user completed all tasks, or 7 days have elapsed without results (kick the member from the guild if that happens as well). Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add the mute and permissions to this channel if/when I detect them re-entering the guild."
                break;
            case 'classE':
                this.banDuration = null;

                msg += ":closed_lock_with_key: **__PREVENTATIVE DISCIPLINE ISSUED__ (Class E)** :closed_lock_with_key: \n\n"
                msg += "The staff are disappointed in your recent conduct. Your behavior has caused problems in the guild to the point preventative discipline is necessary. You are being issued discipline for the following: \n"
                msg += `**Rule number(s) violated:** ${this.rules.join(", ")}` + "\n"
                msg += `**Further Information:** ${this.reason}` + "\n\n"

                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this discipline in this text channel**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable. \n"
                msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                msg3 += "**Staff**: Do not delete this channel until either an appeal has been granted, 48 hours have elapsed and the user has no required tasks to complete, the user completed all tasks, or the user has required tasks to complete and 7 days have elapsed without results (kick the member from the guild if that happens as well). Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add the mute and permissions to this channel if/when I detect them re-entering the guild."
                break;
            case 'classF':
                this.muteDuration = null;

                if (this.banDuration === 0) {
                    msg += ":no_entry_sign: **__PERMANENT BAN ISSUED__ (Class F)** :no_entry_sign: \n\n"
                    msg += "Your conduct in the guild cannot be tolerated any longer. Therefore, for the safety of the community, you are being asked to leave the guild and not to return. We wish you the best in your adventures and hope you enjoyed your stay in this guild. You are being banned for the following: \n"
                    msg += `**Rule number(s) violated:** ${this.rules.join(", ")}` + "\n"
                    msg += `**Further Information:** ${this.reason}` + "\n\n"

                    msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here prior to leaving (once you leave, you will lose access to the guild). If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                    msg3 += "**You have 48 hours to dispute this ban in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this ban final and unappealable. \n"
                    msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                    msg3 += "**Staff**: Do not delete this channel until the appeal deadline has passed, or an appeal has been granted or denied. Please kick the user if they are still in the guild when the appeal deadline passes. Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."

                    if (!guildMember)
                        msg3 += "\n\n**User not in the guild**\nThe ban was applied immediately."
                } else {
                    msg += ":no_entry: **__TEMPORARY BAN ISSUED__ (Class F)** :no_entry: \n\n"
                    msg += "The staff are greatly disappointed in your conduct; we know you can do better than this. We ask that you take a break from the guild for some time and reflect on your mistakes. To facilitate this, you have been issued a temporary ban for the following: \n"
                    msg += `**Rule number(s) violated:** ${this.rules.join(", ")}` + "\n"
                    msg += `**Further Information:** ${this.reason}` + "\n\n"
                    msg += "During your temporary ban, the staff would like to see you reflect on your mistakes and put a plan of action in place to improve your behavior. Staff may need to issue a permanent ban if this happens again."

                    msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here prior to leaving (once you leave, you will lose access to the server until the suspension ends). If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                    msg3 += "**You have 48 hours to dispute this temp ban in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this temp ban final and unappealable. \n"
                    msg3 += "Thank you for your understanding and cooperation." + "\n\n"
                    msg3 += "**Staff**: Do not delete this channel until the appeal deadline has passed, or an appeal has been granted or denied. Please kick the user if they are still in the guild when the appeal deadline passes. Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."

                    if (!guildMember)
                        msg3 += "\n\n**User not in the guild**\nThe ban was applied immediately."
                }
                break;
            case 'classG':
                this.muteDuration = 0;
                this.banDuration = null;

                msg += ":incoming_envelope:  **__YOU ARE MUTED FOR AN INVESTIGATION__ (Class G)** :incoming_envelope:  \n\n"
                msg += "Your recent conduct necessitates an investigation because you violated rules pertaining to a third party (such as Discord or the law). Until the investigation concludes, you will be muted. You are being muted for the following: \n"
                msg += `**Rule number(s) violated:** ${this.rules.join(", ")}` + "\n"
                msg += `**Further Information:** ${this.reason}` + "\n\n"

                msg3 += "**You are obligated to comply with this investigation and answer any questions asked by staff truthfully**. A permanent ban will be issued if you do not comply. You have the right to remain silent and refuse to answer questions, but if you do answer them, you must answer truthfully. Once the investigation concludes and the third party (Discord or law enforcement) makes a decision, you will be informed on what happens next." + "\n\n"
                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this investigation in this text channel**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this investigation final and unappealable. \n"
                msg3 += "**Staff**: Do not delete this channel until an appeal is granted or the investigation concludes. Also, if a member loses access to this channel, you can grant access back with the command `!grant username/mention/snowflake`."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add the mute and permissions to this channel if/when I detect them re-entering the guild."
        }

        // prepare a modLog
        var modLog = new ModLog(this.guild)
            .setType(this.type)
            .setModerator(this.responsible)
            .setUser(this.user)
            .setReason(this.reason)
            .setDiscipline({
                xp: this.xp,
                yang: this.yang,
                reputation: this.reputation,
                schedule: null
            })
            .setChannelRestrictions(this.channelRestrictions)
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
                msg2 += "**Permanent Ban** \n"
                msg2 += `Once you leave the guild, a ban will be placed on you. This ban will remain in place indefinitely or until staff manually remove it. Until you leave or staff kick you, you will remain muted.` + "\n\n"
            } else {
                msg2 += "**Temporary Ban** \n"
                msg2 += `Once you leave the guild, a ban will be placed on you, which will be removed by the bot in ${this.banDuration} days. Your temp-ban time will not begin until you leave the guild or get kicked; until then, you will remain muted.` + "\n\n"
            }
        }

        // Check class D discipline
        classD();

        // Add a schedule if a mute is in place
        if (this.muteDuration !== null && this.muteDuration > 0) {
            const removemute = await this.client.schedule.create('removemute', moment().add(this.muteDuration, 'hours').toDate(), {
                data: {
                    user: this.user.id,
                    guild: this.guild.id,
                    role: mutedRole.id,
                    incidentsChannel: (this.channel !== null && this.channel.id) ? this.channel.id : null
                }
            });
            modLog.setDiscipline({
                xp: this.xp,
                yang: this.yang,
                reputation: this.reputation,
                schedule: removemute.id
            });
            modLog.setExpiration(moment().add(this.muteDuration, 'hours').toISOString(true));
        }

        // Issue discipline

        // First, channel restrictions
        if (this.channelRestrictions.length > 0) {
            msg2 += `**Channel Restrictions**` + " \n"
            msg2 += `You can no longer access the following text channels:`
            this.channelRestrictions.map(channel => {
                var theChannel = this.guild.channels.resolve(channel)

                if (theChannel) {
                    msg2 += ` ${theChannel.name},`
                    theChannel.createOverwrite(this.user, {
                        VIEW_CHANNEL: false
                    }, `Discipline case ${this.case}`);
                }
            })
            msg2 += "\n\n"
        }

        // Next, add restriction permissions
        if (this.permissions.length > 0) {
            msg2 += `**Restrictive Roles**` + " \n"
            msg2 += `These permission-restrictive roles have been added:`
            this.permissions.map(permission => {
                var theRole = this.guild.roles.resolve(permission)

                if (theRole) {
                    msg2 += ` ${theRole.name},`
                    if (guildMember) {
                        guildMember.roles.add(theRole, `Discipline case ${this.case}`);
                    } else {
                        this.user.guildSettings(this.guild.id).update(`roles`, theRole, this.guild, { action: 'add' });
                    }
                }
            })
            msg2 += "\n\n"
        }

        if (this.xp > 0) {
            await this.user.guildSettings(this.guild.id).update(`xp`, (this.user.guildSettings(this.guild.id).xp - this.xp));

            msg2 += `**Loss of ${this.xp} XP**` + " \n"
            msg2 += `Your XP is now at ${(this.user.guildSettings(this.guild.id).xp)}` + "\n\n"

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
            this.user.guildSettings(this.guild.id).update(`yang`, (this.user.guildSettings(this.guild.id).yang - this.yang));

            msg2 += `**Loss of ${this.yang} Yang**` + " \n"
            msg2 += `Your Yang balance is now at ${(this.user.guildSettings(this.guild.id).yang)}` + "\n\n"
        }
        if (this.reputation > 0) {
            this.user.guildSettings(this.guild.id).update(`badRep`, (this.user.guildSettings(this.guild.id).badRep + this.reputation));

            msg2 += `**${this.reputation} bad reputation added to profile**` + " \n"
            if (this.user.guildSettings(this.guild.id).badRep >= 100) {
                msg2 += `Your reputation is now ${this.user.guildSettings(this.guild.id).goodRep} good / ${(this.user.guildSettings(this.guild.id).badRep)} bad` + "\n"
                msg2 += `:warning: **You have 100 or more bad reputation**. This means future discipline for any rule violations could include a temporary or permanent ban.` + "\n\n"
            } else {
                msg2 += `Your reputation is now ${this.user.guildSettings(this.guild.id).goodRep} good / ${(this.user.guildSettings(this.guild.id).badRep)} bad` + "\n\n"
            }
        }
        if (this.other !== null) {
            msg2 += `**Additional Discipline / Notes**` + " \n"
            msg2 += `${this.other}` + "\n\n"
        }

        // If the member is no longer in the guild, issue the ban or tempban immediately, and undo the mute
        if (!guildMember) {
            if (this.banDuration === null || this.banDuration > 0)
                await this.guild.settings.update('pendIncidents', { channel: this.channel.id, user: this.user.id }, { action: 'add' });
            if (this.banDuration !== null) {
                await this.guild.members.ban(this.user, { days: 7, reason: this.reason });
                if ((this.classD.apology === null && this.classD.research === null && this.classD.retraction === null) || this.banDuration === 0) {
                    this.user.guildSettings(this.guild.id).update(`roles`, mutedRole, this.guild, { action: 'remove' });
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
                        reputation: this.reputation,
                        schedule: removeban.id
                    });
                    modLog.setExpiration(moment().add(this.banDuration, 'days').toISOString(true));
                }
            }
        }

        // Add 30 to the raid score for permanent bans and temp bans
        if (this.banDuration !== null) {
            this.guild.raidScore(30);

            // Add 20 to the raid score for mutes
        } else if (this.muteDuration !== null) {
            this.guild.raidScore(20);

            // Add 10 to the raid score for all other discipline
        } else {
            this.guild.raidScore(10);
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
        this.channel.send("\n" + msg + "\n\n" + msg2 + msg3, {
            split: true,
            reply: this.user
        })

        return this;
    }

    // Called when the staff member fails to complete the wizard
    async cancel () {
        // Get the configured muted role
        const muted = this.guild.settings.muteRole;
        const mutedRole = this.guild.roles.resolve(muted);

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
                this.user.guildSettings(this.guild.id).update(`roles`, mutedRole, this.guild, { action: 'remove' });
            }
        }
        await this.message.delete();
        await this.channel.send(`:ok_hand: The staff member who was working on your discipline has decided against taking any action. We apologize for any inconvenience this caused you. If you were muted, the mute was removed.`);
        return this;
    }

};


