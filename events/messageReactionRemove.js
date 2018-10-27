const {Event} = require('klasa');

module.exports = class extends Event {

    run(reaction, user) {
        if (!reaction.message.member)
            return null;

            // Remove earned rep if necessary
        if (reaction.message.author.id !== this.client.user.id)
        {
            console.log(`Rep removing`);
            var removeRep = false;
            reaction.message.reactions
                    .each((reaction) => {
                        if (reaction.me)
                            removeRep = true;
                    });

            if (removeRep && !user.bot && reaction.message.author.id !== user.id && reaction.emoji.id === reaction.message.guild.settings.get("repEmoji"))
            {
                console.log(`Remove rep`);
                reaction.message.member.settings.update(`goodRep`, reaction.message.member.settings.goodRep - 1);
            }
        } else {
            reaction.message.reactions.removeAll();
        }
    }
};


