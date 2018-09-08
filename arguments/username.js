const {Argument, util: {regExpEsc}, RichMenu} = require('klasa');
const {GuildMember, User, MessageEmbed} = require('discord.js');

const USER_REGEXP = Argument.regex.userOrMember;

function resolveUser(query, guild) {
    if (query instanceof GuildMember)
        return query.user;
    if (query instanceof User)
        return query;
    if (typeof query === 'string') {
        if (USER_REGEXP.test(query))
            return guild.client.users.fetch(USER_REGEXP.exec(query)[1]).catch(() => null);
        if (/\w{1,32}#\d{4}/.test(query)) {
            const res = guild.members.find(member => member.user.tag === query);
            return res ? res.user : null;
        }
    }
    return null;
}

module.exports = class extends Argument {

    async run(arg, possible, msg) {
        if (!msg.guild)
            return this.store.get('user').run(arg, possible, msg);
        const resUser = await resolveUser(arg, msg.guild);
        if (resUser)
            return resUser;

        const results = [];
        const reg = new RegExp(regExpEsc(arg), 'i');
        for (const member of msg.guild.members.values()) {
            if (reg.test(member.user.username))
            {
                results.push(member.user);
            } else if (reg.test(member.nickname))
            {
                results.push(member.user);
            }
        }

        let querySearch;
        if (results.length > 0) {
            const regWord = new RegExp(`\\b${regExpEsc(arg)}\\b`, 'i');
            const filtered = results.filter(user => regWord.test(user.username));
            querySearch = filtered.length > 0 ? filtered : results;
        } else {
            querySearch = results;
        }

        switch (querySearch.length) {
            case 0:
                throw `:x: Sorry, I could not find any users matching the criteria provided for ${possible.name}. Please make sure you provided a valid username, nickname, mention, or id.`;
            case 1:
                return querySearch[0];
            default:
                var menu = new RichMenu(new MessageEmbed()
                        .setTitle('Multiple Users Found; Choose a User')
                        .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to select an option.')
                        );
                querySearch.forEach(option => {
                   menu.addOption(option.tag, option.id); 
                });
                const collector = await menu.run(await msg.channel.send('Please wait...'), {time: 60000});
                const choice = await collector.selection;
                collector.message.delete();
                if (menu.options[choice])
                {
                    return this.run(menu.options[choice].name, possible, msg);
                } else {
                    throw `:stop_button: The request was canceled.`;
                }
        }
    }

};


