const { Route } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');
const config = require("../config");
const moment = require("moment");
const sanitizeHtml = require('sanitize-html');
const isImageUrl = require('is-image-url');

module.exports = class extends Route {

    constructor(...args) {
        super(...args, {
            route: 'profile',
            authenticated: true
        });
    }

    async get (request, response) {

        if (!request.query.guild) return response.end(JSON.stringify({ error: "Guild was not specified" }));
        if (!request.query.user) return response.end(JSON.stringify({ error: "User was not specified" }));

        const guild = this.client.guilds.resolve(request.query.guild)
        if (!guild) return response.end(JSON.stringify({ error: "The bot is not in the provided guild." }));

        try {
            var authUser = await this.client.users.fetch(request.auth.scope[ 0 ]);
            if (!authUser) throw new Error("Authorized user not found");
            var authMember = await guild.members.fetch(authUser.id);
            if (!authMember) throw new Error("Authorized user does not seem to be in the provided guild.");
        } catch (e) {
            return response.end(JSON.stringify({ error: `Authorized user ${request.auth.scope[ 0 ]} not found or is not in the guild. You must be in the guild to view the profiles of guild members.` }));
        }

        try {
            var user = await this.client.users.fetch(request.query.user);
            if (!user) throw new Error("User not found");
        } catch (e) {
            return response.end(JSON.stringify({ error: "Unable to fetch the provided user." }));
        }

        var bans;
        var isBanned = false;
        try {
            bans = await guild.fetchBans();
            if (bans.get(user.id))
                isBanned = true;
        } catch (e) {

        }

        const userSettings = await user.guildSettings(guild.id);

        var guildMember;
        try {
            guildMember = await guild.members.fetch(user.id)
            var joined;
            if (guildMember) {
                joined = guildMember.joinedAt;
            }
        } catch (e) {

        }

        var xp = userSettings.xp;
        var level = Math.floor(0.177 * Math.sqrt(xp)) + 1;
        var upper = Math.ceil((level / 0.177) ** 2);
        var lower = Math.ceil(((level - 1) / 0.177) ** 2);
        var fillValue = Math.min(Math.max((xp - lower) / (upper - lower), 0), 1);
        var guildStoreSettings = guild.settings.yangStore;

        var respond = {
            tag: user.tag,
            title: userSettings.profile.title,
            avatar: user.displayAvatarURL({ format: 'png' }),
            background: userSettings.profile.background,
            xp: userSettings.xp,
            activity: parseInt(userSettings.activityScore * 100) / 100,
            joined: joined ? moment(joined).format("YYYY-MM-DD") : "N/A",
            goodrep: userSettings.goodRep,
            hp: guildMember ? guildMember.HP : await user.HP(guild.id),
            yang: userSettings.yang,
            xpprogress: parseInt(fillValue * 100),
            level: level,
            identities: userSettings.profile.identities,
            dob: userSettings.profile.dob,
            location: userSettings.profile.location,
            info: userSettings.profile.info,
            donations: userSettings.profile.donations,
            isbanned: isBanned,
            ismuted: userSettings.muted,
            roles: guildMember ? guildMember.roles.map((role) => {
                return {name: role.name, color: role.hexColor}
            }) : [],
            yangStore: {
                profileTitle: guildStoreSettings.profileTitle,
                profileBackground: guildStoreSettings.profileBackground
            }
        }

        return response.end(JSON.stringify({ message: respond }));
    }

    async post (request, response) {
        if (!request.body || !request.body.action) return response.end(JSON.stringify({ error: "An action is required." }));

        switch (request.body.action) {
            case 'edit':
                if (!request.body.guild) return response.end(JSON.stringify({ error: "guild is required (snowflake ID of the guild involved)." }));
                if (!request.body.user) return response.end(JSON.stringify({ error: "user is required (snowflake ID of the user being edited)." }));

                const guild = this.client.guilds.resolve(request.body.guild)
                if (!guild) return response.end(JSON.stringify({ error: "The bot is not in the provided guild." }));

                try {
                    var authUser = await this.client.users.fetch(request.auth.scope[ 0 ]);
                    if (!authUser) throw new Error("Authorized user not found");
                    var authMember = await guild.members.fetch(authUser.id);
                    if (!authMember) throw new Error("Authorized user does not seem to be in the provided guild.");
                } catch (e) {
                    return response.end(JSON.stringify({ error: `Unable to fetch the authorized user; user is either not found or is not in the guild.` }));
                }

                var sameUser = request.auth.scope[ 0 ] === request.body.user;

                if (guild && guild.settings.modRole) {
                    if (!sameUser && !authMember.roles.get(guild.settings.modRole)) return response.end(JSON.stringify({ error: `You do not have the modRole and are therefore not allowed to edit the profiles of other members.` }));
                } else if (!sameUser && !authMember.permissions.has('VIEW_AUDIT_LOG')) {
                    return response.end(JSON.stringify({ error: `You do not have VIEW_AUDIT_LOG permissions and therefore are not allowed to edit the profiles of other members.` }));
                }

                try {
                    var user = await this.client.users.fetch(request.body.user);
                    if (!user) throw new Error("User not found");
                    var userSettings = await user.guildSettings(guild.id);
                    if (!userSettings) throw new Error("User settings not found");
                } catch (e) {
                    return response.end(JSON.stringify({ error: "Unable to fetch the provided user." }));
                }

                if (sameUser) {
                    var bans;
                    var isBanned = false;
                    try {
                        bans = await guild.fetchBans();
                        if (bans.get(user.id))
                            isBanned = true;
                    } catch (e) {

                    }
                    var guildMember;
                    var isMuted;
                    var isNotAllowed;
                    try {
                        guildMember = await guild.members.fetch(user.id)
                        if (guildMember) {
                            isMuted = guildMember.settings.muted;
                            isNotAllowed = guildMember.settings.restrictions.cannotEditProfile;
                        }
                    } catch (e) {

                    }

                    if (isBanned) return response.end(JSON.stringify({ error: `You cannot edit your profile; you have been banned from this guild.` }));
                    if (isMuted) return response.end(JSON.stringify({ error: `You cannot edit your profile while you are muted in the guild. Please contact a staff member for assistance if you are trying to correct your profile for being in violation of the rules.` }));
                    if (isNotAllowed) return response.end(JSON.stringify({ error: `Due to past abuse, you are not allowed to edit your profile; only staff may do so at their discretion.` }));
                }

                if (request.body.title) {
                    request.body.title = sanitizeHtml(request.body.title, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                    if (sameUser && request.body.title !== '' && request.body.title !== userSettings.profile.title && userSettings.yang < 50) return response.end(JSON.stringify({ error: `You do not have enough Yang to change your title.` }));
                    if (request.body.title.length > 64) return response.end(JSON.stringify({ error: `Title may not be more than 64 characters long.` }));
                    if (/[^\x20-\x7E]/g.test(request.body.title)) return response.end(JSON.stringify({ error: `Title may not contain special characters.` }));
                    if (sameUser && request.body.title !== '' && request.body.title !== userSettings.profile.title) await userSettings.update('yang', userSettings.yang - 50);
                    await userSettings.update('profile.title', request.body.title);
                    userSettings = await user.guildSettings(guild.id);
                }

                if (request.body.background || request.body.background === "") {
                    if (request.body.background !== '' && !isImageUrl(request.body.background)) return response.end(JSON.stringify({ error: `Cover Image URL is not a valid URL to an image.` }));
                    if (sameUser && request.body.background !== '' && request.body.background !== userSettings.profile.background && userSettings.yang < 150) return response.end(JSON.stringify({ error: `You do not have enough Yang to change your cover image.` }));
                    if (sameUser && request.body.background !== '' && request.body.background !== userSettings.profile.background) await userSettings.update('yang', userSettings.yang - 150);
                    if (request.body.background === "") {
                        await userSettings.reset('profile.background');
                    } else {
                        await userSettings.update('profile.background', request.body.background);
                    }
                    userSettings = await user.guildSettings(guild.id);
                }

                if (request.body.pronouns) {
                    request.body.pronouns = sanitizeHtml(request.body.pronouns, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                    if (request.body.pronouns.length > 64) return response.end(JSON.stringify({ error: `Pronouns may not be more than 64 characters long.` }));
                    if (/[^\x20-\x7E]/g.test(request.body.pronouns)) return response.end(JSON.stringify({ error: `Pronouns may not contain special characters.` }));
                    await userSettings.update('profile.pronouns', request.body.pronouns);
                    userSettings = await user.guildSettings(guild.id);
                }

                if (request.body.identities) {
                    request.body.identities = sanitizeHtml(request.body.identities, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                    if (request.body.identities.length > 96) return response.end(JSON.stringify({ error: `Identities may not be more than 96 characters long.` }));
                    if (/[^\x20-\x7E]/g.test(request.body.identities)) return response.end(JSON.stringify({ error: `Identities may not contain special characters.` }));
                    await userSettings.update('profile.identities', request.body.identities);
                    userSettings = await user.guildSettings(guild.id);
                }

                if (request.body.dob) {
                    if (sameUser && userSettings.profile.dob !== null && userSettings.profile.dob !== request.body.dob) return response.end(JSON.stringify({ error: `Date of birth cannot be changed once already set except by a staff member.` }));
                    if (request.body.dob !== '' && !moment(request.body.dob).isValid()) return response.end(JSON.stringify({ error: `Date of birth is not a valid date. Try using the format YYYY-MM-DD.` }));
                    await userSettings.update('profile.dob', request.body.dob !== '' ? moment(request.body.dob).format("YYYY-MM-DD") : null);
                    userSettings = await user.guildSettings(guild.id);
                }

                if (request.body.location) {
                    request.body.location = sanitizeHtml(request.body.location, {
                        allowedTags: [],
                        allowedAttributes: {}
                    });
                    if (request.body.location.length > 64) return response.end(JSON.stringify({ error: `Location may not be more than 64 characters long.` }));
                    if (/[^\x20-\x7E]/g.test(request.body.location)) return response.end(JSON.stringify({ error: `Location may not contain special characters.` }));
                    await userSettings.update('profile.location', request.body.location);
                    userSettings = await user.guildSettings(guild.id);
                }

                if (request.body.info) {
                    if (request.body.info !== '' && request.body.info !== '<p><br></p>' && sameUser && userSettings.xp < 128) return response.end(JSON.stringify({ error: `You must have 128 or more XP before you can have custom profile info.` }));
                    request.body.info = sanitizeHtml(request.body.info, {
                        allowedTags: [ 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
                            'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'u', 's', 'span' ],
                        allowedAttributes: {
                            a: [ 'href', 'name', 'target' ],
                            span: [ 'style' ],
                            p: [ 'style' ]
                        },
                        allowedStyles: {
                            '*': {
                                // Match HEX and RGB
                                color: [ /^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/ ],
                                'text-align': [ /^left$/, /^right$/, /^center$/ ],
                            }
                        },
                        // Lots of these won't come up by default because we don't allow them
                        selfClosing: [ 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
                        // URL schemes we permit
                        allowedSchemes: [ 'http', 'https' ],
                        allowedSchemesByTag: {},
                        allowedSchemesAppliedToAttributes: [ 'href', 'src', 'cite' ],
                        allowProtocolRelative: true
                    });

                    if (request.body.info.length > 2048) return response.end(JSON.stringify({ error: `Profile info may not be more than 2048 characters long (including HTML tags).` }));
                    if (/[^\x20-\x7E]/g.test(request.body.info)) return response.end(JSON.stringify({ error: `Profile info may not contain special characters.` }));

                    var newLines = request.body.info.split("<br").length - 1;
                    if (newLines > 25) return response.end(JSON.stringify({ error: `Profile info may not contain more than 25 new lines / line breaks; that's spammy.` }));

                    var uppercase = request.body.info.replace(/[^A-Z]/g, "").length;
                    var lowercase = request.body.info.replace(/[^a-z]/g, "").length;

                    if ((uppercase + lowercase) !== 0 && (uppercase / (uppercase + lowercase)) > 0.25) return response.end(JSON.stringify({ error: `Profile info may not contain more than 25% uppercase characters; that's spammy.` }));
                    if (/(.)\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1/.test(request.body.info.toLowerCase())) return response.end(JSON.stringify({ error: `Profile info may not contain 20 or more of the same consecutive character; that's spammy.` }));

                    var newstring = request.body.info;
                    var regex = /(\W|^)(.+)\s\2/gmi;
                    var matcher = regex.exec(request.body.info);
                    while (matcher !== null) {
                        newstring = newstring.replace(matcher[ 2 ], ``);
                        matcher = regex.exec(request.body.info);
                    }
                    var patternScore = (request.body.info.length > 0 ? (newstring.length / request.body.info.length) : 1);
                    if (patternScore < (2 / 3) && request.body.info !== '' && request.body.info !== '<p><br></p>') return response.end(JSON.stringify({ error: `More than 1/3 of the profile info is repeated 2 or more times; this is spammy.` }));

                    var profane = [];
                    var profaneCount = 0;
                    config.profanity.map((word) => {
                        var numbers = getIndicesOf(word, request.body.info, false);
                        if (numbers.length > 0) {
                            profane.push(word);
                            profaneCount += numbers.length;
                        }
                    });
                    if (profaneCount >= 5)
                        return response.end(JSON.stringify({ error: `Profile info may not contain more than 4 uses of profane words. Yours had ${profaneCount}. Words detected: ${profane.join(", ")}` }));

                    await userSettings.update('profile.info', request.body.info);
                    userSettings = await user.guildSettings(guild.id);
                }

                if (guild) {
                    const _channel = this.client.channels.resolve(guild.settings.eventLogChannel);
                    if (_channel) {
                        _channel.send(`:bust_in_silhouette: The profile of ${user.tag} (${user.id}) was edited by ${authUser.tag} (${authUser.id}).`)
                    }
                }
                return response.end(JSON.stringify({ message: "Success" }));
                break;
        }
    }
};

function getIndicesOf (searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}