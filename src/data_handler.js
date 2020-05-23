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

function getTotal(stats) {
    var i;
    var total = 0;
    for (i = 0; i < stats.length; i++) {
        spread = stats[i].split('/');
        total += spread[1];
    }
    return total;
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
        var lvl1stats = data[name]['lvl1stats'][rarity.toString()];
        lvl1stats.push(getTotal(lvl1stats));
        console.log(lvl1stats);
        unit.setLvl1Stats(lvl1stats);
        unit.setGrowths(data[name]['growths']);
        unit.setLvl40Stats();
        return unit;
    }
}