const {Event} = require('klasa');

module.exports = class extends Event {

    run(message) {
        if (!message.member || message.author.bot)
            return null;

        // Remove all good rep earned from reactions, if any.

        console.log(`Rep remove all`);
        var removeRep = false;
        message.reactions
                .each((reaction) => {
                    if (reaction.me)
                        removeRep = true;
                });

        if (removeRep)
        {
            console.log(`Remove all rep`);
            const noRep = reaction.message.guild.settings.noRep
            const noRepRole = reaction.message.guild.roles.resolve(noRep)      
            message.reactions
                    .filter((reaction) => reaction.emoji.id === reaction.message.guild.settings.repEmoji && !reaction.me && reaction.message.author.id !== message.author.id && (!noRepRole || !reaction.message.member.roles.get(noRepRole.id)))
                    .each((reaction) => {
                        console.log(`A rep removed`);
                        message.member.settings.update('goodRep', message.member.settings.goodRep - 1);
                    });
        }
    }

};