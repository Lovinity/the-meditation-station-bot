module.exports = async function (message, item, quantity = 1) {
    var yangPrice = message.guild.settings.yangStore[item] || 0;
    yangPrice *= quantity;

    if (yangPrice <= 0)
        return true;
    
    var yangBalance = message.member.settings.yang;
    
    if (parseInt(yangBalance) < parseInt(yangPrice))
    {
        message.channel.send(`:x: Aww, bummer! You do not have enough Yang to purchase ${quantity} ${item}. It costs ${yangPrice} Yang, but you only have ${yangBalance} yang.`);
        return false;
    }
    
    var response = await message.ask(`:credit_card: It will cost ${yangPrice} yang to purchase ${quantity} ${item}. You have ${yangBalance} yang. Proceed?`);
    if (response)
    {
        await message.member.settings.update('yang', parseInt(yangBalance) - parseInt(yangPrice));
        return true;
    } else {
        message.channel.send(`:x: Canceled.`);
        return false;
    }
    
    return false;
}

