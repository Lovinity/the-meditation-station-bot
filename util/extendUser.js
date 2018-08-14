const { Structures } = require('discord.js');

Structures.extend('User', User => class MyUser extends User {

    constructor(...args) {
        super(...args);
        this.settings = this.client.gateways.users.get(`${this.id}`, true);
    }

});



