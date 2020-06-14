const fs = require('fs');
const sql = require('mysql')

var rawData = fs.readFileSync('Aliases.json');
var data = JSON.parse(rawData);
var keys = Object.keys(data);

//handles alias file operations

var con = sql.createConnection({
    host: process.env.DATABASE_URL,
    user: 'rjrcwbcyxuzkby',
    password: 'd5c3e6b0a90889a0457ae81a1da9282433a385bb3fa8e0e45e846cd21b71f07f'
});

con.connect(function(err) {
    if (err) throw err;
    console.log('Connected!');
});

var filter = [ 
    'best', 'worst', 'fuck', 'bitch', 'shit', 'damn', 'crap', 'stupid', 'bad', 'good',
    'better', 'worse', 'pussy', 'cunt', 'cancer', 'suck', 'dick', 'penis', 'twat', 'vagina',
    'boob', 'breast', 'booty', 'butt', 'ass', 'aids', 'worth', 'sex', 'bara', 'hitler', 'dad',
    'mom', 'bara', 'garbage', 'trash', 'awful', 'great', 'amazing', 'excellent', 'perfect',
    'horrible', 'hate', 'love', 'like', 'tit', 'abs', 'cute', 'hot', 'ugly', 'fanservice',
    'armpit', 'thigh', 'cheek', 'crotch', 'snatch', 'taint', 'slut', 'whore', 'prostitute',
    'hoe', 'thot', 'virgin', 'perv', 'hentai', 'mina', 'horn', 'thirst', 'chest', 'loli',
    'milf', 'dilf', 'ara'
];

function loopThroughKeys(callback) {
    for (var i = 0; i < keys.length; i++) {
        var oldKey = keys[i];
        var oldKeyLowerCase = oldKey.toLowerCase();
        var oldKeys = oldKey.split('+');
        var oldKeysLowerCase = oldKeyLowerCase.split('+');
        if (callback(oldKey, oldKeyLowerCase, oldKeys, oldKeysLowerCase))
            return true;
    }
    return false;
}

function filterAlias(alias) {
    for (var i in filter) {
        if (alias.indexOf(filter[i]) > -1)
            return false;
    }
    return true;
}

function refresh() {
    rawData = fs.readFileSync('Aliases.json');
    data = JSON.parse(rawData);
    keys = Object.keys(data);
}

module.exports = {
    getProperName(name) {
        var lowerCaseName = name.toLowerCase();
        var out = '';
        loopThroughKeys((oldKey, oldKeyLowerCase, oldKeys, oldKeysLowerCase) => {
            var lowerCaseData = data[oldKey].toLowerCase();
            if (lowerCaseName == lowerCaseData || oldKeysLowerCase.includes(lowerCaseName) ||
                lowerCaseData.replace(/_/g, ' ') == lowerCaseName) {
                out = data[oldKey];
                return true;
            }
            return false;
        });
        return out;
    },
    addAlias(name, alias) {
        var lowerCaseAlias = alias.toLowerCase();
        var lowerCaseName = name.toLowerCase();
        if (!filterAlias(lowerCaseAlias))
            return false;
        var removeKey;
        var alreadyExists = loopThroughKeys((oldKey, oldKeyLowerCase, oldKeys, oldKeysLowerCase) => {
            if (oldKeysLowerCase.includes(lowerCaseAlias)) {
                return true;
            }
        });
        if (alreadyExists)
            return false;
        var out = loopThroughKeys((oldKey, oldKeyLowerCase, oldKeys, oldKeysLowerCase) => {
            if ((data[oldKey].toLowerCase == lowerCaseName || oldKeysLowerCase.includes(lowerCaseName))
                && oldKeys.length < 6) {
                    Object.defineProperty(data, oldKey+'+'+alias, Object.getOwnPropertyDescriptor(data, oldKey));
                    removeKey = oldKey;
                    return true;
            }
            return false;
        });
        if (out) {
            delete data[removeKey];
            var newData = JSON.stringify(data, null, 4);
            fs.writeFileSync('Aliases.json', newData);
            refresh();
        }
        return out;
    },
    getAliases(name) {
        var lowerCaseName = name.toLowerCase();
        var newName = '';
        var aliases = [];
        loopThroughKeys((oldKey, oldKeyLowerCase, oldKeys, oldKeysLowerCase) => {
            if (data[oldKey].toLowerCase() == lowerCaseName || oldKeysLowerCase.includes(lowerCaseName)) {
                newName = data[oldKey].replace(/_/g, ' ');
                aliases = oldKeys;
                return true;
            }
            return false;
        });
        return { 'name': newName, 'output': aliases.join(', ') };
    },
    removeAlias(alias) {
        var lowerCaseAlias = alias.toLowerCase();
        var removeKey;
        var out = loopThroughKeys((oldKey, oldKeyLowerCase, oldKeys, oldKeysLowerCase) => {
            var nameIndex = oldKeysLowerCase.indexOf(lowerCaseAlias);
            if (oldKeys.length > 1 && nameIndex > 0) {
                oldKeys.splice(nameIndex, 1);
                Object.defineProperty(data, oldKeys.join('+'), Object.getOwnPropertyDescriptor(data, oldKey));
                removeKey = oldKey;
                return true;
            }
            return false;
        });
        if (out) {
            delete data[removeKey];
            var newData = JSON.stringify(data, null, 4);
            fs.writeFileSync('Aliases.json', newData);
            refresh();
        }
        return out;
    }
};