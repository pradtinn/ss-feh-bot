require('dotenv').config()
const Discord = require('discord.js');
const bot = new Discord.Client();
const input = require('./input.js');
var Input = input.Input;
const webScraper = require('./web_scraper.js');
const fs = require('fs');
const emotes = require('./emotes.js');
const errors = require('./error_messages.js');

const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
    console.info('Logged in as '+bot.user.tag+'!');
});

var getUnitData = async(input, pfp, callback) => {
    var website = 'https://feheroes.gamepedia.com/'+input.getName();
    var unitData = await webScraper.parseSite(website, input.getRarity(), input.getBoon(), input.getBane(), 
        input.getMerges(), input.getDragonflowers());
    var imagePath = 'Art/'+unitData.getImageFolder()+'/Face_FC.png';
    var rarityString = '';
    for (var i = 0; i < 5; i++) { 
        if (i < unitData.getRarity())
            rarityString += emotes.rarityEmotes[unitData.getRarity()]; 
        else
            rarityString += ' ';
    }
    rarityString += ' '+emotes.weaponEmotes[unitData.getWeaponType()];
    rarityString += ' '+emotes.moveEmotes[unitData.getMoveType()];
    var unitEmbed = new Discord.MessageEmbed()
        .setColor('#04c2ac')
        .setTitle(unitData.getNameTitle())
        .setDescription(rarityString)
        .addFields(
            { name: 'Stats', value: unitData.print() }
        );
    if (unitData.getName() != 'Bramimond' || pfp == null) {
        fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (!err) {
                unitEmbed
                    .attachFiles(imagePath)
                    .setThumbnail('attachment://Face_FC.png');
            }
            callback(unitEmbed);
        });
    } else {
        console.log(pfp);
        unitEmbed
            .setThumbnail(pfp);
        callback(unitEmbed);
    }
};

var getUnitsData = async(inputs, callback) => {
    var unitsData = [];
    var embed = new Discord.MessageEmbed().setColor('#04c2ac');
    for (var i = 0; i < inputs.length; i++) {
        var website = 'https://feheroes.gamepedia.com/'+inputs[i].getName();
        unitsData[i] = await webScraper.parseSite(website, inputs[i].getRarity(), inputs[i].getBoon(), inputs[i].getBane(),
            inputs[i].getMerges(), inputs[i].getDragonflowers());
    }
    if (unitsData[0].getNameTitle() == unitsData[1].getNameTitle()) {
        embed
        .addFields(
            { name: unitsData[0].getNameTitle()+' 1', value: unitsData[0].print(), inline: true },
            { name: unitsData[1].getNameTitle()+' 2', value: unitsData[1].print(), inline: true },
            { name: 'Comparison Results', value: unitsData[0].getCompareString(unitsData[1]) }
        );   
    } else {
        embed
        .addFields(
            { name: unitsData[0].getNameTitle(), value: unitsData[0].print(), inline: true },
            { name: unitsData[1].getNameTitle(), value: unitsData[1].print(), inline: true },
            { name: 'Comparison Results', value: unitsData[0].getCompareString(unitsData[1]) },
        );
    }
    callback(embed);
}

var getSkillData = async(name, callback) => {
    var desc = await webScraper.parseSkill(name);
    var skillEmbed = new Discord.MessageEmbed()
        .setColor('#04c2ac')
        .setTitle(name)
        .addFields(
            { name: 'Desc', value: desc }
        );
    callback(skillEmbed);
}

function handleError(msg) {
    var errorMessages = errors.errorMessages;
    var errIndex = Math.floor(Math.random() * errorMessages.length);
    var shouldInsult = Math.floor(Math.random() * 10);
    msg.react('605823560572862540');
    if (shouldInsult >= 4)
        msg.channel.send(errorMessages[errIndex]);
}

bot.on('message', msg => {
    var message = msg.content;
    var channel = msg.channel;
    if (message.substring(0, 1) == '!') {
        if (message.substring(1) == 'heelp') {
            msg.member.createDM().then((dmchannel) => {
                dmchannel.send('`!h <rarity> <unit name> +<merges> /<boon initial><bane initial> |<dragonflowers>` to search for a hero\'s statline\n'+
                'Only unit name is required, the other parameters are optional\n'+
                '`!a <unit name>$<alias>` adds alias for hero\n'+
                '`!a <unit name>` for hero\'s aliases\n'+
                '`!ra <alias>` to remove alias\n'+
                '`!c <unit 1 name>.<unit 2 name>` to compare units\n'+
                '`!sd <passive skill name>` to look up passive skill description'+
                '`!heelp` to have commands DM\'d to you\n'+
                'Now that you know the commands you have no excuse for slipping up, got it?');
            });
        }
        var i = new Input(message.substring(1));
        if (i.getName() != 'ERROR') {
            switch(i.getCmd()) {
                case 'h': {
                    getUnitData(i, msg.author.avatarURL(), (unitEmbed) => {
                        channel.send(unitEmbed);
                    });
                }
                break;
                case 'a': {
                    if (i.getOutput() != '') {
                        var aliasEmbed = new Discord.MessageEmbed() 
                            .setColor('#04c2ac')
                            .setTitle(i.getName())
                            .addFields(
                                { name: 'Aliases', value: i.getOutput() }
                            );
                        channel.send(aliasEmbed);
                    }
                }
                break;
                case 'c': {
                    var sections = i.getInputString().split('.');
                    if (sections.length == 2) {
                        sections[0] = 'h'+sections[0];
                        sections[1] = 'h '+sections[1];
                        var inputs = [ new Input(sections[0]), new Input(sections[1]) ];
                        if (inputs[0].getName() == 'ERROR' || inputs[1].getName() == 'ERROR') {
                            handleError(msg);
                            break;
                        }
                        getUnitsData(inputs, (embed) => {
                            channel.send(embed);
                        });
                    }
                } 
                break;
                case 'sd': {
                    getSkillData(i.getInputString(), (embed) => {
                        channel.send(embed);
                    });
                }
                break;
            }
            if (i.getReact())
                msg.react('✅');
        } else {
            handleError(msg);
        }
    } else if (message == '<:flayn:605823560572862540>') {
        var callOut = Math.floor(Math.random() * 100);
        if (callOut >= 80)
            channel.send('Stop flayning');
    } else if (msg.mentions.has(bot.user)) {
        msg.react('605823560572862540');
    }
});