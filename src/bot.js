require('dotenv').config()
const Discord = require('discord.js');
const bot = new Discord.Client();
const input = require('./input.js');
var Input = input.Input;
const fs = require('fs');
const emotes = require('./emotes.js');
const errors = require('./error_messages.js');
const dataHandler = require('./data_handler.js');
const aliasHandler = require('./alias_handler.js');
const webScraper = require('./web_scraper.js');
const { spawn } = require('child_process');
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();

const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
    console.info('Logged in as '+bot.user.tag+'!');
});

function handleH(i, msg, callback) {
    const name = "'"+i.getName().replace(/'/g, "''")+"'";
    client.query(`SELECT "FIND_UNIT"(${name})`)
        .then(result => {
            callback(result);
        })
        .catch(error => {
            console.log(error);
            handleError(msg);
        });
}

var getUnitData = async(input, pfp, callback) => {
    var unitData = await dataHandler.getUnit(input.getName(), input.getRarity(), input.getBoon(), input.getBane(),
        input.getMerges(), input.getDragonflowers());
    var imagePath = 'Art/'+unitData.getImageFolder()+'/Face_FC.png';
    var rarityString = '';
    for (var i = 0; i < unitData.getRarity(); i++) { 
        rarityString += emotes.rarityEmotes[unitData.getRarity()]; 
    }
    rarityString += ' '+emotes.weaponEmotes[unitData.getWeaponType()];
    rarityString += ' '+emotes.moveEmotes[unitData.getMoveType()];
    for (var i = 0; i < 5 - unitData.getRarity(); i++) {
        rarityString += '<:Blank:703011527573242032>';
    }
    var unitEmbed = new Discord.MessageEmbed()
        .setColor('#04c2ac')
        .setTitle(unitData.getNameTitle())
        .setDescription(rarityString)
        .addFields(
            { name: 'Stats', value: unitData.print() },
            { name: 'Weapon', value: unitData.getWeapon() }
        );
    if (unitData.getAssist() != '') {
        unitEmbed.addField('Assist', unitData.getAssist());
    }
    if (unitData.getSpecial() != '') {
        unitEmbed.addField('Special', unitData.getSpecial());
    }
    var abc = ['A', 'B', 'C'];
    abc.forEach(element => {
        if (unitData.getPassive(element) != '') {
            unitEmbed.addField(element, unitData.getPassive(element));
        }
    });
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
        unitsData[i] = await dataHandler.getUnit(inputs[i].getName(), inputs[i].getRarity(), inputs[i].getBoon(), inputs[i].getBane(),
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
    var descName = await webScraper.parseSkill(name);
    if (descName[0] == '')
        descName[0] = name;
    var skillEmbed = new Discord.MessageEmbed()
        .setColor('#04c2ac')
        .setTitle(descName[0])
        .addFields(
            { name: 'Desc', value: descName[1] }
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

function addNewUnit(name) {
    return spawn('python', [
        '-u',
        'get_unit_data.py',
        name
    ]);
}

function lookUpWeapon(name, sendWeaponData, msg) {
    const child = spawn('python', [
        '-u',
        'get_weapon.py',
        name
    ]);
    child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
    child.on('exit', (code) => {
        if (code == 0)
            sendWeaponData(msg);
        else 
            handleError(msg);
    });
}

function sendWeaponData(msg) {
    const weapon_file = fs.readFileSync('weapon_lookup_result.json');
    if (weapon_file.length == 0) {
        handleError(msg);
        return 1;
    }
    const weapon_data = JSON.parse(weapon_file);
    var owners = Object.keys(weapon_data['owners']).sort((a, b) => { return weapon_data['owners'][a] - weapon_data['owners'][b]; });
    var owner_string = '```\n';
    owners.forEach(value => {
        owner_string += `${value}: ${weapon_data['owners'][value]}*\n`;
    });
    owner_string += '\n```';
    const weaponEmbed = new Discord.MessageEmbed()
        .setColor('#04c2ac')
        .setTitle(weapon_data['name']+' '+emotes['weaponEmotes'][weapon_data['type']])
        // .setThumbnail(weapon_data['image-link'])
        .addField('Stats', `**Might:** ${weapon_data['might']}\n**Range:** ${weapon_data['range']}`);
    if (weapon_data['prereq'] != 'None') {
        weaponEmbed.addField('Prerequisite', weapon_data['prereq'].join());
    }
    if (weapon_data['desc'] != 'None') {
        weaponEmbed.addField('Description', weapon_data['desc']);
    }
    if (weapon_data['refine'] != 'None') {
        weaponEmbed.addField('Refine', weapon_data['refine']);
    }
    if (Object.keys(weapon_data['owners']).length > 0) {
        weaponEmbed.addField('Owners', owner_string);
    }
    if (weapon_data['image-link'] != '') {
        weaponEmbed.setThumbnail(weapon_data['image-link']);
    }
    msg.channel.send(weaponEmbed);
    return 0;
}

bot.on('message', msg => {
    var message = msg.content;
    var channel = msg.channel;
    var author = msg.author;
    if (message.substring(0, 1) == '!') {
        if (message.substring(1) == 'heelp') {
            msg.member.createDM().then((dmchannel) => {
                dmchannel.send('`!h <rarity> <unit name> +<merges> /<boon initial><bane initial> |<dragonflowers>` to search for a hero\'s statline\n'+
                'Only unit name is required, the other parameters are optional\n'+
                '`!a <unit name>$<alias>` adds alias for hero\n'+
                '`!a <unit name>` for hero\'s aliases\n'+
                '`!ra <alias>` to remove alias\n'+
                '`!c <unit 1 name>.<unit 2 name>` to compare units\n'+
                '`!sd <passive skill name>` to look up passive skill description\n'+
                '`!heelp` to have commands DM\'d to you\n'+
                '`!calendar` to view this month\'s calendar\n'+
                '`!w <weapon name>` to look up a weapon\n'+
                'Now that you know the commands you have no excuse for slipping up, got it?');
            });
            return;
        }
        var i = new Input(message.substring(1));
        if (i.getName() != 'ERROR') {
            switch(i.getCmd()) {
                case 'h': {
                    handleH(i, msg, (result) => {
                        const find = result['rows'][0]['FIND_UNIT'];
                        i.verifyValues(find);
                        if (i.getName() != 'ERROR') {
                            getUnitData(i, msg.author.avatarURL(), (unitEmbed) => {
                                msg.channel.send(unitEmbed);
                            });
                        } else
                            handleError(msg);
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
                        handleH(inputs[0], msg, (result1) => {
                            const find1 = result1['rows'][0]['FIND_UNIT'];
                            inputs[0].verifyValues(find1);
                            if (inputs[0].getName() != 'ERROR') {
                                handleH(inputs[1], msg, (result2) => {
                                    const find2 = result2['rows'][0]['FIND_UNIT'];
                                    inputs[1].verifyValues(find2);
                                    if (inputs[1].getName() != 'ERROR') {
                                        getUnitsData(inputs, (embed) => {
                                            channel.send(embed);
                                        });
                                    } else
                                        handleError(msg);
                                });
                            } else
                                handleError(msg);
                        });
                        // if (inputs[0].getName() == 'ERROR' || inputs[1].getName() == 'ERROR') {
                        //     handleError(msg);
                        //     break;
                        // }
                        // getUnitsData(inputs, (embed) => {
                        //     channel.send(embed);
                        // });
                    }
                } 
                break;
                case 'sd': {
                    var child = spawn('python', [
                        '-u',
                        'get_skill.py',
                        i.getInputString()
                    ]);
                    child.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    child.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                    });
                    getSkillData(i.getInputString(), (embed) => {
                        channel.send(embed);
                    });
                }
                break;
                case 'update': {
                    if (/*msg.author.id == "611005635223617577" || */msg.author.id == "305397153910751242") {
                        var child = addNewUnit(i.getName());
                        child.stdout.on('data', (data) => {
                            console.log(`stdout: ${data}`);
                        });
                        child.stderr.on('data', (data) => {
                            console.log(`stderr: ${data}`)
                        });
                    } else {
                        handleError(msg);
                    }
                    dataHandler.refresh();
                }
                break;
                case 'calendar': {
                    const attachment = new Discord.MessageAttachment('./Calendar.png');
                    channel.send(attachment);
                }
                break;
                case 'w': {
                    lookUpWeapon(i.getInputString(), sendWeaponData, msg);
                }
                break;
                case 'gib': {
                    const child = spawn('python', [
                        '-u',
                        'art.py',
                        i.getInputString()
                    ]);
                    child.stdout.on('data', (data) => {
                        console.log(`${data}`);
                    });
                    child.stderr.on('data', (data) => {
                        if (data.includes('safebooru')) {
                            channel.send(`${data}`);
                        } else if (data.includes('ERROR')) {
                            console.log('ERROR');
                            handleError(msg);
                        }
                    })
                }
            }
            if (i.getReact())
                msg.react('✅');
        } else {
            handleError(msg);
        }
    } else if (message == '<:flayn:605823560572862540>' && channel.id == '518217165153894460') {
        var callOut = Math.floor(Math.random() * 100);
        if (callOut >= 80)
            channel.send('Stop flayning');
    } else if (msg.mentions.has(bot.user)) {
        msg.react('605823560572862540');
    }
});