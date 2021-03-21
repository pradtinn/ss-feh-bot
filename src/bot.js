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
const { isObject } = require('util');
const unit = require('./unit.js');
const { DEFAULT_MIN_VERSION } = require('tls');
// const snipe = require('./message_snipe.js');

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

function getSnapback(author) {
    const snapbacks = errors.snapbacks;
    return snapbacks[Math.floor(Math.random() * snapbacks.length)].replace(/user/g, author);
}

function findUnit(name, msg, callback) {
    client.query('SELECT "FIND_UNIT"($1::text)', [name])
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
    var embed = new Discord.MessageEmbed()
        .setColor('#04c2ac')
        .setTitle('Comparison Result');
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
    var errorMessages = errors.niceErrorMessages;
    var errIndex = Math.floor(Math.random() * errorMessages.length);
    var shouldInsult = Math.floor(Math.random() * 10);
    msg.react('658148293024415794');
    if (shouldInsult >= 4)
        msg.channel.send(errorMessages[errIndex]);
}

function addNewUnit(name) {
    return spawn('python3', [
        '-u',
        'get_unit_data.py',
        name
    ]);
}

function lookUpWeapon(name, isUnit, sendWeaponData, msg) {
    const child = spawn('python3', [
        '-u',
        'get_weapon.py',
        name,
        isUnit
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

function lookUpSkill(name, sendSkillData, msg) {
    const child = spawn('python3', [
        '-u',
        'get_skill.py',
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
            sendSkillData(msg)
        else
            handleError(msg);
    })
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
        .setTitle(decodeURI(weapon_data['name'])+' '+emotes['weaponEmotes'][weapon_data['type']])
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

function replaceWithEmote(str) {
    Object.entries(emotes.moveEmotes).forEach(([key, value]) => {
        let reg = new RegExp(key, 'g')
        str = str.replace(reg, value);
    });
    Object.entries(emotes.weaponEmotes).forEach(([key, value]) => {
        let reg = new RegExp(key, 'g')
        str = str.replace(reg, value);
    });
    return str;
}

function sendSkillData(msg) {
    const skill_file = fs.readFileSync('skill_lookup_result.json');
    if (skill_file.length == 0) {
        handleError(msg);
        return 1;
    }
    const skill_data = JSON.parse(skill_file);
    let owners_string = '```\n';
    skill_data['owners'].forEach(([name, rarity]) => {
        owners_string += `${name}: ${rarity}*\n`;
    });
    owners_string += '```\n';
    let inherit_string = replaceWithEmote(skill_data['inherit']);
    const skill_embed = new Discord.MessageEmbed()
        .setColor('#04c2ac')
        .setTitle(skill_data['name'])
        .addFields(
            {'name': 'Inheritance', 'value': inherit_string},
            {'name': 'Description', 'value': skill_data['desc']},
            {'name': 'Owners', 'value': owners_string}
        );
    if (skill_data.hasOwnProperty('image'))
        skill_embed.setThumbnail(skill_data['image']);
    msg.channel.send(skill_embed);
    return 0;
}

function printMatrix(M) {
    let out = '';
    for (let j = 0; j < M[0].length; j++) {
        for (let i = 0; i < M.length; i++) {
            out += M[i][j]+'\t';
        }
        out += '\n';
    }
    console.log(out);
}

function lev(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    M = [];
    let m = a.length, n = b.length;
    let i = 0, j = 0;
    for (i = 0; i <= m; i++) {
        M.push(new Array(n+1).fill(0));
    }
    for (i = 1; i <= m; i++)
        M[i][0] = i;
    for (j = 1; j <= n; j++)
        M[0][j] = j;

    for (j = 1; j <= n; j++) {
        for (i = 1; i <= m; i++) {
            let substitutionCost = 1;
            if (a[i-1] === b[j-1])
                substitutionCost = 0;
            M[i][j] = Math.min(
                M[i-1][j]+1,
                M[i][j-1]+1,
                M[i-1][j-1]+substitutionCost
            );
        }
    }
    if (M[m][n] <= 3) {
        console.log(a+', '+b);
        printMatrix(M);
    }
    return M[m][n];
}

function approximateName(target, callback) {
    client.query('SELECT * FROM aliases')
        .then(result => {
            const rows = result['rows'];//.filter(unit => unit['alias1'][0].toLowerCase() == target[0].toLowerCase());
            let closestMatch = Math.pow(10, 1000);
            let closestNames = [];
            rows.forEach(unit => {
                for ([col, name] of Object.entries(unit)) {
                    if (col == 'unit')
                        continue;
                    if (name == 'None')
                        break;
                    let distance = lev(target, name);
                    if (distance < closestMatch) {
                        closestMatch = distance;
                        closestNames = [name];
                    } else if (distance == closestMatch) {
                        closestNames.push(name);
                    }
                }
            });
            callback(closestNames);
        });
}

bot.on('message', msg => {
    var message = msg.content;
    var channel = msg.channel;
    var author = msg.author;
    if (!author.bot) {
        switch (message.toLowerCase()) {
            case 'ayy': channel.send('lmao');
            break;
            case 'all i want for christmas': channel.send('https://m.youtube.com/watch?v=2RtI5UEZlzU');
            break;
            case 'don\'t fuck with us smashing summoners':
            case 'dont fuck with us smashing summoners': channel.send('We repeat the same inside jokes every 5 minutes!');
            break;
            case 'your honor': channel.send('*I\'m* balling');
            break;
            case 'ok floot, what is the best christmas song?': channel.send('https://www.youtube.com/watch?v=EFLaUL8NG9Y');
            break;
            case 'ok floot, where is canada?': channel.send('Canada doesn\'t exist');
            break;
            case 'you are not a clown': channel.send('You are the entire circus.');
            break;
            case 'what song do i listen to?': channel.send('Broey\'s current addiction:\n https://www.youtube.com/watch?v=86q0FZSBm68');
            break;
            case 'fuck you floot': channel.send(getSnapback(author.username));
        }
    }
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
        if (message.substring(1) == 'brazil') {
            channel.send('https://media.discordapp.net/attachments/699139136401178645/748094502908198993/ca5.gif');
        }
        var i = new Input(message.substring(1));
        if (i.getName() != 'ERROR') {
            switch(i.getCmd()) {
                case 'h': {
                    let testName = i.getName();
                    findUnit(i.getName(), msg, (result) => {
                        const find = result['rows'][0]['FIND_UNIT'];
                        i.verifyValues(find);
                        if (i.getName() != 'ERROR') {
                            getUnitData(i, msg.author.avatarURL(), (unitEmbed) => {
                                msg.channel.send(unitEmbed);
                            });
                        } else {
                            approximateName(testName, (closestNames) => {
                                console.log(closestNames);
                                let out = `No results found for ${testName}, maybe you meant one of these units:\`\`\`\n`;
                                closestNames.forEach(name => {
                                    out += name+'\n';
                                });
                                out += '```';
                                console.log(out);
                                msg.channel.send(out);
                            });
                        }
                    });
                }
                break;
                case 'a': {
                    if (i.getAlias() == '') {
                        findUnit(i.getName(), msg, (result) => {
                            let find = result['rows'][0]['FIND_UNIT'];
                            if (find == null) {
                                handleError(msg);
                                return;
                            }
                            // find = "'"+find.replace(/'/g, "''")+"'";
                            client.query('SELECT * FROM aliases WHERE unit ILIKE $1::text', [find])
                                .then((ali) => {
                                    if (ali == null) {
                                        handleError(msg);
                                        return;
                                    }
                                    const aliases = ali['rows'][0];
                                    let ali_string = "";
                                    let foundNone = false;
                                    let i = 0;
                                    Object.values(aliases).forEach((value) => {
                                        if (i > 0 && !foundNone) {
                                            if (value == "None")
                                                foundNone = true;
                                            else {
                                                if (i > 1)
                                                    ali_string += ", ";
                                                ali_string += value;
                                            }
                                        }
                                        i++;
                                    });
                                    const aliasEmbed = new Discord.MessageEmbed()
                                        .setColor("#04c2ac")
                                        .setTitle(find.replace(/_/g, ' '))
                                        .addField("Aliases", ali_string);
                                    channel.send(aliasEmbed);
                                })
                                .catch((error) => {
                                    console.log(error);
                                    handleError(msg);
                                });
                        });
                    } else {
                        findUnit(i.getAlias(), msg, (result) => {
                            let find = result['rows'][0]['FIND_UNIT'];
                            if (find != null) {
                                handleError(msg);
                                return;
                            }
                            findUnit(i.getName(), msg, (result2) => {
                                find = result2['rows'][0]['FIND_UNIT'];
                                if (find == null) {
                                    handleError(msg);
                                    return;
                                }
                                let alias = i.getAlias();
                                // let alias = "'"+i.getAlias().replace(/'/g, "''")+"'";
                                // let name = "'"+find.replace(/'/g, "''")+"'";
                                client.query('SELECT "ADD_ALIAS"($1::text, $2::text)', [find, alias])
                                    .then((result3) => {
                                        let added = result3['rows'][0]['ADD_ALIAS'];
                                        if (!added) {
                                            handleError(msg);
                                        } else {
                                            msg.react('✅');
                                        }
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        handleError(msg);
                                    })
                            });
                        });
                    }
                }
                break;
                case 'ra': {
                    // let alias = "'"+i.getName().replace(/'/g, "''")+"'";
                    let alias = i.getName();
                    client.query('SELECT "REMOVE_ALIAS"($1::text)', [alias])
                        .then((result) => {
                            const removed = result['rows'][0]['REMOVE_ALIAS'];
                            if (!removed) {
                                handleError(msg);
                            } else {
                                msg.react('✅');
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            handleError(msg);
                        });
                }
                break;
                case 'c': {
                    var sections = i.getInputString().split('.');
                    if (sections.length == 2) {
                        sections[0] = 'h'+sections[0];
                        sections[1] = 'h '+sections[1];
                        var inputs = [ new Input(sections[0]), new Input(sections[1]) ];
                        findUnit(inputs[0].getName(), msg, (result1) => {
                            const find1 = result1['rows'][0]['FIND_UNIT'];
                            inputs[0].verifyValues(find1);
                            if (inputs[0].getName() != 'ERROR') {
                                findUnit(inputs[1].getName(), msg, (result2) => {
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
                    }
                } 
                break;
                case 'sd': {
                    lookUpSkill(i.getInputString(), sendSkillData, msg);
                }
                break;
                case 'update': {
                    var child = addNewUnit(i.getName());
                    child.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    child.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`)
                    });
                    client.query('INSERT INTO aliases VALUES ($1::text, $2::text);', [i.getName(), i.getAlias()])
                        .then(() => {
                            dataHandler.refresh();
                        })
                        .catch(error => {
                            console.log(error);
                            handleError(msg);
                        });
                }
                break;
                case 'calendar': {
                    // let attachment = new Discord.MessageAttachment('./Calendar_EST.png');
                    // if (i.getInputString().toLowerCase() == 'pst') {
                    attachment = new Discord.MessageAttachment('./Calendar_PST.png');
                    // }
                    channel.send(attachment);
                }
                break;
                case 'w': {
                    findUnit(i.getInputString(), msg, (result) => {
                        const find = result['rows'][0]['FIND_UNIT'];
                        i.verifyValues(find);
                        if (i.getName() != 'ERROR') {
                            getUnitData(i, msg.author.avatarURL(), (unitEmbed) => {
                                for (const field of unitEmbed.fields) {
                                    if (field['name'] == 'Weapon') {
                                        let w = encodeURI(field['value']);
                                        console.log(w);
                                        lookUpWeapon(w, true, sendWeaponData, msg);
                                    }
                                }
                            });
                        } else
                            lookUpWeapon(i.getInputString(), false, sendWeaponData, msg);
                    });
                }
                break;
                case 'gib': {
                    const child = spawn('python3', [
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
                break;
                case 'snipe': {
                    return;
                    // channel.messsages.fetch()
                    //     .then(messages => snipe.getMessage(allMessages));
                }
                break;
                case 'test': {
                    embed = new Discord.MessageEmbed()
                        .setThumbnail('https://static.wikia.nocookie.net/feheroes_gamepedia_en/images/a/a0/Alm_Hero_of_Prophecy_Face_FC.webp/revision/latest/');
                    channel.send(embed);
                }
            }
        } else {
            handleError(msg);
        }
    } else if (message == '<:flayn:605823560572862540>' && channel.id == '518217165153894460') {
        var callOut = Math.floor(Math.random() * 100);
        if (callOut >= 80)
            channel.send('Stop flayning');
    } else if (msg.mentions.has(bot.user)) {
        if (author.id == '708368869605244938') 
            channel.send('No');
        else msg.react('605823560572862540');
    }
});