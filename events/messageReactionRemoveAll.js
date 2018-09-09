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
            message.reactions
                    .filter((reaction) => reaction.emoji.name === "➕" && !reaction.me && reaction.message.author.id !== message.author.id)
                    .each((reaction) => {
                        console.log(`A rep removed`);
                        message.member.settings.update('goodRep', message.member.settings.goodRep - 1);
                    });
        }
    }

};