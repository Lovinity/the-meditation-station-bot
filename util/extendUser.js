const { Structures } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

  constructor(...args) {
    super(...args);

    /*
    // Guild based member settings
    this.guildSettings = (guildID) => {
      return this.client.gateways.members.create([ guildID, this.id ]);
    };
    */

    this.HP = (guildID) => {
      var settings = this.guildSettings(guildID);

      var damage = settings.HPDamage;
      var decay = guild.settings.oneHPPerXP;
      var HP = (100 + Math.floor(decay > 0 ? settings.xp / decay : 0)) - damage;
      if (HP < 0) HP = 0;
      return HP;
    };

  }

});



