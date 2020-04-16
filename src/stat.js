//stat class

class Stat {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    clone() {
        return new Stat(this.name, this.value);
    }
    getName() {
        return this.name;
    }
    getValue() {
        return this.value;
    }
    toString() {
        var out = '';
        var i;
        for (i = 0; i < 3-this.value.toString().length; i++)
            out += ' ';
        out += this.value.toString();
        return out;
        //return this.name+': '+this.value.toString()+'\n';
    }
    changeStat(modifier) {
        this.value += modifier;
    }
    increase(growthRate, rarity) {
        return this.value + Math.floor( 39 * ( Math.floor( growthRate * ( 0.79 + ( 0.07 * rarity ) ) )/100 ) );
    }
}

function indexToStat(name) {
    switch(name) {
        case  'HP': return 0; 
        case 'ATK': return 1;
        case 'SPD': return 2;
        case 'DEF': return 3; 
        case 'RES': return 4;
        case 'Total': return 5;
    }
}

function superChecker(growth) {
    switch(growth.getValue()) {
        case 25:
        case 45:
        case 70: return '+';
        case 30:
        case 50:
        case 75: return '-';
    }
    return '';
}

module.exports = {
    compare: function(stat1, stat2) {
        if (stat1.name == 'Total' && stat2.name != 'Total')
            return 1;
        if (stat2.name == 'Total' && stat2.name != 'Total')
            return -1;
        if (stat1.value != stat2.value) {
            return stat2.value - stat1.value;
        }
        var index1 = indexToStat(stat1.name);
        var index2 = indexToStat(stat2.name);
        if (index1 != index2)
            return index1 - index2;
        return 0;
    },
    compare2: function(stat1, stat2) {
        var index1 = indexToStat(stat1.name);
        var index2 = indexToStat(stat2.name);
        if (index1 != index2)
            return index1 - index2;
        return 0;
    },
    copyStatArr: function(source, dest) {
        var i;
        for (i = 0; i < source.length; i++) {
            if (i >= dest.length)
                break;
            dest[i] = source[i].clone();
        }
    },
    changeMultipleStats(arr, values, indeces) {
        if (values.length != indeces.length) {
            console.log('ERROR: values is not the same length as indeces');
            return;
        }
        var i;
        for (i = 0; i < indeces.length; i++) {
            arr[indeces[i]].changeStat(values[i]);
        }
    },
    statArrToString: function(arr) {
        var i;
        var out = '';
        for (i = 0; i < arr.length; i++) {
            out += arr[i].toString();
        }
        return out;
    },
    statArrsToString: function(arr1, arr2, arr3, boon, bane, merges) {
        var i;
        var out = '';
        for (i = 0; i < arr1.length-1 && i < arr2.length-1 && i < arr3.length; i++) {
            switch(arr1[i].getName()) {
                case boon: out += '+';
                break;
                case bane: { 
                    if (merges < 1)
                        out += '-'; 
                    else
                        out += ' '
                }
                break;
                default: out += ' ';
                break;
            }
            out += arr1[i].getName() + ' ';
            var j;
            for (j = 0; j < 3-arr1[i].getName().length; j++)
                out += ' ';
            out += arr1[i].toString() + ' | '+arr2[i].toString()
            if (merges < 1)
                out += superChecker(arr3[i]);
            out += '\n';
        }
        return out;
    },
    initStatArray: function(names) {
        var out = Array(names.length);
        var i;
        for (i = 0; i < names.length; i++) {
            out[i] = new Stat(names[i], 0);
        }
        return out;
    },
    Stat: Stat
}