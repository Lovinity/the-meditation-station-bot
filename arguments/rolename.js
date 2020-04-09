const {Argument, util: {regExpEsc}, RichMenu} = require('klasa');
const {Role, MessageEmbed} = require('discord.js');

const ROLE_REGEXP = Argument.regex.role;

function resolveRole(query, guild) {
    if (query instanceof Role)
        return guild.roles.cache.get(query.id) ? query : null;
    if (typeof query === 'string' && ROLE_REGEXP.test(query))
        return guild.roles.resolve(ROLE_REGEXP.exec(query)[1]);
    return null;
}

module.exports = class extends Argument {

    async run(arg, possible, message) {
        if (!message.guild)
            return this.role(arg, possible, message);
        const resRole = resolveRole(arg, message.guild);
        if (resRole)
            return resRole;

        const results = [];
        const reg = new RegExp(regExpEsc(arg), 'i');
        for (const role of message.guild.roles.cache.values()) {
            if (reg.test(role.name))
                results.push(role); }

        let querySearch;
        if (results.length > 0) {
            const regWord = new RegExp(`\\b${regExpEsc(arg)}\\b`, 'i');
            const filtered = results.filter(role => regWord.test(role.name));
            querySearch = filtered.length > 0 ? filtered : results;
        } else {
            querySearch = results;
        }

        switch (querySearch.length) {
            case 0:
                throw `${possible.name} Must be a valid name, id or role mention`;
            case 1:
                return querySearch[0];
            default:
                var menu = new RichMenu(new MessageEmbed()
                        .setTitle('Multiple Roles Found; Choose a Role')
                        .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to select an option.')
                        );
                querySearch.forEach(option => {
                    menu.addOption(option.id, option.name);
                });
                const collector = await menu.run(await message.send('Please wait...'), {time: 60000, filter: (reaction, user) => user.id === message.author.id});
                const choice = await collector.selection;
                if (menu.options[choice])
                {
                    return this.run(menu.options[choice].name, possible, message);
                } else {
                    throw `:stop_button: The request was canceled.`;
                }
        }
    }

};


