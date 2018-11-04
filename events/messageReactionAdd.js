const {Event} = require('klasa');

module.exports = class extends Event {

    run(reaction, user) {
        if (!reaction.message.member)
            return null;

        // Add rep if this is a rep earning message
        if (reaction.message.author.id !== this.client.user.id && !user.bot && reaction.message.author.id !== user.id && reaction.emoji.id === reaction.message.guild.settings.repEmoji)
        {
            console.log(`Rep earning`);
            var addRep = false;
            reaction.message.reactions
                    .each((reaction) => {
                        if (reaction.me)
                            addRep = true;
                    });

            if (addRep && !user.bot)
            {
                console.log(`Add rep`);
                reaction.message.member.settings.update(`goodRep`, reaction.message.member.settings.goodRep + 1);
            }
        }
    }
};


