const fs = require('fs');
const {Client} = require('pg')

var rawData = fs.readFileSync('Aliases.json');
var data = JSON.parse(rawData);
var keys = Object.keys(data);

//handles alias file operations

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();

// Object.entries(data).forEach(entry => {
//     let aliasesArr = entry[0].split('+');
//     while (aliasesArr.length > 5) {
//         aliasesArr.pop();
//     }
//     let i = 1;
//     let aliases = "";
//     aliasesArr.forEach(val => {
//         if (i != 1)
//             aliases += ", "
//         aliases += "'"+val.replace(/'/g, "''")+"'";
//         i++;
//     });
//     const unit = entry[1].replace(/'/g, "''");
//     let columns = "unit, ";
//     i = 1;
//     aliases.split(", ").forEach(val => {
//         if (i < 6) {
//             if (i != 1)
//                 columns += ", ";
//             columns += "alias"+i;
//             i++;
//         }
//     });
//     client.query(`INSERT INTO aliases (${columns}) VALUES ('${unit}', ${aliases})`, (err) => {
//         if (err) {
//             console.log(aliases);
//             console.log(err);
//         }
//     });
// });

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

function queryDatabase(str) {
    return new Promise((resolve, reject) => {
        client.query(str, (err, res) => {
            if (err) reject(err);
            resolve(res);
        })
    });
}

module.exports = {
    async getProperName(name) {
        name = "'"+name.replace(/'/g, "''")+"'";
        client.query(`SELECT "FIND_UNIT"(${name})`)
            .then(result => {
                const find = result['rows'][0]['FIND_UNIT'];
                console.log(find);
                if (find == null)
                    return 'ERROR';
                return find;
            })
            .catch(error => {
                return 'ERROR';
            });
        // var out = '';
        // var lowerCaseName = name.toLowerCase();
        // loopThroughKeys((oldKey, oldKeyLowerCase, oldKeys, oldKeysLowerCase) => {
        //     var lowerCaseData = data[oldKey].toLowerCase();
        //     if (lowerCaseName == lowerCaseData || oldKeysLowerCase.includes(lowerCaseName) ||
        //         lowerCaseData.replace(/_/g, ' ') == lowerCaseName) {
        //         out = data[oldKey];
        //         return true;
        //     }
        //     return false;
        // });
        // return out;
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