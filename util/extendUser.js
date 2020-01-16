const { Structures } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

  constructor(...args) {
    super(...args);

    this.HP = async (guildID) => {
      var settings = await this.guildSettings(guildID);

      var damage = settings.HPDamage;
      var decay = guild.settings.oneHPPerXP;
      var HP = (100 + Math.floor(decay > 0 ? settings.xp / decay : 0)) - damage;
      if (HP < 0) HP = 0;
      return HP;
    };

  }

});



