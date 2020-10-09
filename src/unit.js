var stat = require('./stat.js');
var skill = require('./skill.js');
var date = require('./date.js');
const emotes = require('./emotes.js');
var Date = date.Date;
var Skill = skill.Skill;

//unit data class

class Unit {
    //constructor for unit
    constructor(name, rarity, boon, bane, merges, dragonflowers) {
        name = name.split('_').join(' ');
        var nameTitle = name.split(':');
        this.name = nameTitle[0];
        this.title = nameTitle[1];
        this.rarity = parseInt(rarity, 10);
        this.boon = boon.toUpperCase();
        this.bane = bane.toUpperCase();
        this.merges = parseInt(merges, 10);
        this.dragonflowers = parseInt(dragonflowers, 10);
        var names = ['HP', 'ATK', 'SPD', 'DEF', 'RES', 'Total'];
        this.lvl1Stats = stat.initStatArray(names);
        this.growths = stat.initStatArray(names);
        this.lvl40Stats = stat.initStatArray(names);
        
        this.weapon = new Skill('');
        this.assist = new Skill('');
        this.special = new Skill('');
        this.passives = {'A': new Skill(''), 'B': new Skill(''), 'C': new Skill('')}

        this.moveType;
        this.releaseDate;
        this.weaponType;
    }
    //accessor methods
    getName() {
        return this.name;
    }
    getTitle() {
        return this.title;
    }
    getNameTitle() {
        return this.name.concat(':', this.title);
    }
    getImageFolder() {
        var noSpaceTitle = this.title.replace(/ /g, '');
        var noSpaceName = this.name.replace(/ /g, '');
        return noSpaceName.concat('-', noSpaceTitle);
    }
    getRarity() {
        return this.rarity;
    }
    getBoon() {
        return this.boon;
    }
    getBane() {
        return this.bane;
    }
    getMerges() {
        return this.merges;
    }
    getLvl1Stats() {
        return this.lvl1Stats;
    }
    getGrowths() {
        return this.growths;
    }
    getLvl40Stats() {
        return this.lvl40Stats;
    }
    getTotal() {
        return this.lvl40Stats[5].toString();
    }
    getWeapon() {
        return this.weapon.getName();
    }
    getAssist() {
        return this.assist.getName();
    }
    getSpecial() {
        return this.special.getName();
    }
    getPassive(index) {
        return this.passives[index].getName();
    }
    getReleaseDate() {
        return this.releaseDate;
    }
    getMoveType() {
        return this.moveType;
    }
    getWeaponType() {
        return this.weaponType;
    }
    //output method
    print() {
        var out = '```diff\n Lvl   1 |  40\n     --- | ---\n'+
            stat.statArrsToString(this.lvl1Stats, this.lvl40Stats, this.growths, this.boon, this.bane, this.merges)+
            '\n```Total: '+this.getTotal()+', '+emotes.dragonflowerEmotes[this.moveType]+': '+this.dragonflowers;
        return out;
    }
    //data manipulation
    applyMerges() {
        this.lvl1Stats = this.lvl1Stats.sort(function(a, b) {
            return stat.compare(a, b);
        });
        switch(this.merges) {
            case 10:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [3, 4, 5]);
            case 9:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [1, 2, 5]);
            case 8:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [0, 4, 5]);
            case 7:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [2, 3, 5]);
            case 6:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [0, 1, 5]);
            case 5:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [3, 4, 5]);
            case 4:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [1, 2, 5]);
            case 3:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [0, 4, 5]);
            case 2:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [2, 3, 5]);
            case 1:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1, 2], [0, 1, 5]);
                if (this.boon.length == 0)
                    stat.changeMultipleStats(this.lvl1Stats, [1, 1, 1, 2], [0, 1, 2, 5]);
            break;
        }
        this.lvl1Stats = this.lvl1Stats.sort(function(a, b) {
            return stat.compare2(a, b);
        });
    }
    setLvl1Stats(fullStatSpread) {
        var i;
        for (i = 0; i < fullStatSpread.length; i++) {
            var statSpread = fullStatSpread[i];
            var spreadIndex = 1;
            if (statSpread.length < 2)
                spreadIndex = 0;
            switch(this.lvl1Stats[i].getName()) {
                case this.boon:
                    spreadIndex = 2;
                break;
                case this.bane:
                    if (this.merges == 0)
                        spreadIndex = 0;
                break;
            }
            this.lvl1Stats[i].changeStat(parseInt(statSpread[spreadIndex], 10));
        }
        if (this.merges > 0)
            this.lvl1Stats[5].changeStat(1);
        console.log('First set stat breakpoint: '+stat.statArrToString(this.lvl1Stats));
        this.applyMerges();
        console.log('Merge breakpoint: '+stat.statArrToString(this.lvl1Stats));
        this.verifyDragonflowers();
        console.log('DF check breakpoint: '+stat.statArrToString(this.lvl1Stats));
        this.applyDragonFlowers();
        console.log('DF breakpoint: '+stat.statArrToString(this.lvl1Stats));
    }
    setGrowths(growthSpread) {
        var i;
        for (i = 0; i < growthSpread.length; i++) {
            this.growths[i].changeStat(parseFloat(growthSpread[i]));
        }
    }
    setLvl40Stats() {
        var i;
        var total = 0;
        for (i = 0; i < this.lvl40Stats.length-1; i++) {
            var growthModifier = 0;
            switch(this.lvl40Stats[i].getName()) {
                case this.boon:
                    growthModifier = 5;
                break;
                case this.bane:
                    if (this.merges == 0)
                        growthModifier = -5;
                break;
            }
            this.lvl40Stats[i].changeStat(this.lvl1Stats[i].increase(this.growths[i].getValue()+growthModifier, this.rarity));
            total += this.lvl40Stats[i].getValue();
        }
        this.lvl40Stats[5].changeStat(total);
    }
    setWeapon(weapon) {
        this.weapon.setName(weapon);
    }
    setAssist(assist) {
        this.assist.setName(assist);
    }
    setSpecial(special) {
        this.special.setName(special);
    }
    setPassives(passives) {
        for (var [key, value] of Object.entries(passives)) {
            if (typeof value == 'string')
                this.passives[key].setName(value);
        }
    }
    setMoveType(moveType) {
        if (emotes.moveEmotes.hasOwnProperty(moveType)) {
            this.moveType = moveType;
            return true;
        }
        return false;
    }
    setReleaseDate(releaseDate) {
        this.releaseDate = new Date(releaseDate);
    }
    setWeaponType(weaponType) {
        if (emotes.weaponEmotes.hasOwnProperty(weaponType)) {
            this.weaponType = weaponType;
            return true;
        }
        return false;
    }
    verifyDragonflowers() {
        if (this.dragonflowers > 5) {
            if (this.releaseDate.compare(new Date('2020-8-18')) >= 0) {
                this.dragonflowers = 5;
            }
        } else if (this.moveType != 'Infantry') {
            if (this.dragonflowers > 10) {
                console.log('ERROR: Dragonflowers more than maximum, reverting to +10');
                this.dragonflowers = 10;
            }
        } else if (this.dragonflowers > 10) {
            var tenDFCutoff = new Date('2019-2-20');
            if (this.releaseDate.compare(tenDFCutoff) >= 0) {
                console.log('ERROR: Dragonflowers more than maximum, reverting to +10');
                this.dragonflowers = 10;
            }
        }
    }
    applyDragonFlowers() {
        this.lvl1Stats = this.lvl1Stats.sort(function(a, b) {
            return stat.compare(a, b);
        });
        switch(this.dragonflowers) {
            case 15:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [4, 5]);
            case 14:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [3, 5]);
            case 13:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [2, 5]);
            case 12:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [1, 5]);
            case 11:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [0, 5]);
            case 10:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [4, 5]);
            case 9:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [3, 5]);
            case 8:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [2, 5]);
            case 7:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [1, 5]);
            case 6:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [0, 5]);
            case 5:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [4, 5]);
            case 4:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [3, 5]);
            case 3:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [2, 5]);
            case 2:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [1, 5]);
            case 1:
                stat.changeMultipleStats(this.lvl1Stats, [1, 1], [0, 5]);
            break;
        }
        this.lvl1Stats = this.lvl1Stats.sort(function(a, b) {
            return stat.compare2(a, b);
        });
    }
    getCompareString(unit) {
        var name1, name2;
        var out = [
                'Unit1 has X more HP than Unit2',
                'Unit1 has X more Atk than Unit2',
                'Unit1 has X more Spd than Unit2',
                'Unit1 has X more Def than Unit2',
                'Unit1 has X more Res than Unit2',
                '**Unit1 has X more BST than Unit2**'
            ];
        if (this.getName() == unit.getName()) {
            name1 = this.name+' 1';
            name2 = unit.name+' 2';
        } else {
            name1 = this.name;
            name2 = unit.name;
        }
        for (var i = 0; i < this.lvl40Stats.length; i++) {
            var diff = stat.compare(this.lvl40Stats[i], unit.lvl40Stats[i]);
            var unit1 = diff >= 0 ? name2 : name1;
            var unit2 = unit1 == name1 ? name2 : name1;
            if (diff < 0)
                diff = diff*-1;
            if (diff == 0) {
                var capacity = this.lvl40Stats[i].getName();
                if (capacity != 'HP') {
                    capacity = capacity.toLowerCase();
                    capacity = capacity.replace(/^./, capacity[0].toUpperCase());
                }
                out[i] = 'Unit1 has the same '+capacity+' as Unit2';
                if (capacity == 'Total')
                    out[i] = '**'+out[i]+'**';
            }
            else
                out[i] = out[i].replace('X', diff);
            out[i] = out[i].replace('Unit1', unit1);
            out[i] = out[i].replace('Unit2', unit2);
            out[i] = out[i].replace('Total', 'BST');
        }
        return out.join('\n');
    }
}

module.exports = {
    Unit: Unit
}