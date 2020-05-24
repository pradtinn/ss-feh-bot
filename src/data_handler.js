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

function getStatsWithTotal(stats) {
    var i;
    var out = [];
    var total = 0;
    for (i = 0; i < stats.length; i++) {
        var spread = stats[i].split('/');
        out.push(spread);
        total += parseInt(spread[1], 10);
    }
    out.push(total)
    return out;
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
        unit.setWeapon(data[name]['weapon']);
        unit.setAssist(data[name]['assist']);
        unit.setSpecial(data[name]['special']);
        unit.setPassives(data[name]['passives']);
        var lvl1stats = data[name]['lvl1stats'][rarity.toString()];
        var lvl1statsWithTotal = getStatsWithTotal(lvl1stats);
        console.log(lvl1statsWithTotal);
        unit.setLvl1Stats(lvl1statsWithTotal);
        unit.setGrowths(data[name]['growths']);
        unit.setLvl40Stats();
        return unit;
    },

}