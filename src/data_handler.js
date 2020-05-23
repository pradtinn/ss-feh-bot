const fs = require('fs')
const unit = require('./unit.js')
var Unit = unit.Unit;

var rawData = fs.readFileSync('unit_data.json');
var data = JSON.parse(rawData);

//holds all unit-related data

function searchForAlias(alias) {
    for (var [key, value] of Object.entries(data)) {
        if (value['alias'].includes(alias)) {
            return key;
        }
    }
    return null;
}

module.exports = {
    getName(alias) {
        if (data.hasOwnProperty(alias)) {
            return alias;
        }
        var name = searchForAlias(alias);
        if (name == null) {
            return '';
        }
        return name;
    },
    async getUnit(name, rarity, boon, bane, merges, dragonflowers) {
        var unit = new Unit(name, rarity, boon, bane, merges, dragonflowers);
        unit.setMoveType(data[name]['moveType']);
        unit.setWeaponType(data[name]['weaponType']);
        unit.setReleaseDate(data[name]['releaseDate']);
        console.log(data[name]);
        unit.setLvl1Stats(data[name]['lvl1Stats'][toString(rarity)]);
        unit.setGrowths(data[name]['growths']);
        unit.setLvl40Stats();
        return unit;
    }
}