const { Structures } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

  constructor(...args) {
    super(...args);

    // Guild based member settings
    this.guildSettings = (guildID) => {
      return this.client.gateways.members.create([ guildID, this.id ]);
    };

    this.badRepWithDecay = (guildID) => {
      var settings = this.client.gateways.members.create([ guildID, this.id ]);
      var guild = this.client.guilds.resolve(guildID);
      if (!guild) return settings.badRep;
      var badRep = settings.badRep;
      var decay = guild.settings.badRepDecayXP;
      var newBadRep = decay > 0 ? badRep - Math.floor(settings.xp / decay) : badRep
      if (newBadRep < 0) newBadRep = 0;
      return newBadRep;
    };

  }

});



