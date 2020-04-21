const ah = require('./alias_handler.js');
//input class

class Input {
    constructor(input) {
        //<cmd> <rarity>* <unitname>+<merges>/<boon><bane>|<dragonflowers>
        this.inputString = input;
        this.output = '';
        this.cmd = input.substr(0, input.indexOf(' '));
        this.inputString = this.inputString.slice(input.indexOf(' '));
        this.rarity = 5;
        this.react = false;
        this.name = '';
        this.alias = '';
        this.merge = 0;
        this.ivs = '';
        this.boon = '';
        this.bane = '';
        this.dragonflowers = 0;
        switch(this.cmd) {
            case 'h': {
                this.insertSpaces();
                this.splitString();
                this.formatIVs();
                this.verifyValues();
                this.react = false;
            }
            break;
            case 'a': {
                var numSections = this.determineA();
                if (numSections == 2) {
                    if (this.name.indexOf('$') != -1 || !ah.addAlias(this.name, this.alias)) {
                        this.name = 'ERROR';
                    }
                    else
                        this.react = true;
                } else if (numSections == 1)
                    this.getAliases();
            }
            break;
            case 'ra': {
                var sections = this.inputString.split('$');
                if (sections.length == 1) {
                    this.name = sections[0].slice(1);
                    if (ah.removeAlias(this.name))
                        this.react = true;
                    else
                        this.name = 'ERROR';
                }
            }
            break;
            case 's': {
                var sections = this.inputString.split(' ');
                this.inputString = sections.join(' ');
                this.properUpperCase();
            }
        }
    }

    //!h functions
    insertSpaces() {
        var i;
        var mergeIVDF = '+/|';
        for (i = 0; i < this.inputString.length; i++) {
            if (mergeIVDF.indexOf(this.inputString[i]) != -1 && this.inputString[i-1] != ' ')
                this.inputString = this.inputString.slice(0, i) + ' ' + this.inputString.slice(i);
            if (this.inputString[i] == '*' && this.inputString[i+1] != ' ')
                this.inputString = this.inputString.slice(0, i+1) + ' ' + this.inputString.slice(i+1);
        }
    }
    splitString() {
        var sections = this.inputString.split(' ');

        var i;
        var found = [false, false, false, false];
        for (i = 0; i < sections.length; i++) {
            if (sections[i].indexOf('|') != -1 && !found[0]) {
                this.dragonflowers = parseInt(sections[i].replace('|', ''), 10);
                found[0] = true;
            }
            if (sections[i].indexOf('/') != -1 && !found[1]) {
                this.ivs = sections[i].replace('/', '');
                found[1] = true;
            }
            if (sections[i].indexOf('+') != -1 && !found[2]) {
                this.merge = parseInt(sections[i].replace('+', ''), 10);
                found[2] = true;
            }
            if (sections[i].indexOf('*') != -1 && !found[3]) {
                this.rarity = parseInt(sections[i].replace('*', ''), 10);
                found[3] = true;
            }
            if (/^[A-Z:\\!\)\(]$/i.test(sections[i].charAt(0))) {
                if (this.name.length > 0)
                    this.name += ' ';
                this.name += sections[i];
            }
        }
        if (!isNaN(sections[1])) {
            this.rarity = parseInt(sections[1], 10);
        }
    }
    formatIVs() {
        var i;
        for (i = 0; i < this.ivs.length; i++) {
            var formattedIV = '';
            switch(this.ivs[i]) {
                case 'h':
                    formattedIV = 'HP';
                break;
                case 'a':
                    formattedIV = 'Atk';
                break;
                case 's':
                    formattedIV = 'Spd';
                break;
                case 'd':
                    formattedIV = 'Def';
                break;
                case 'r':
                    formattedIV = 'Res';
                break;
            }
            if (i == 0)
                this.boon = formattedIV;
            else if (i == 1)
                this.bane = formattedIV;
        }
    }
    verifyValues() {
        if (isNaN(this.rarity) || this.rarity < 1 || this.rarity > 5)
            this.rarity = 5;
        if (isNaN(this.merge) || this.merge < 0 || this.merge > 10)
            this.merge = 0;
        if ((this.boon == '' || this.bane == '' && this.merge < 1) || this.boon == this.bane) {
            this.boon = '';
            this.bane = '';
        }
        if (isNaN(this.dragonflowers) || this.dragonflowers < 0 || this.dragonflowers > 10)
            this.dragonflowers = 0;
        this.name = ah.getProperName(this.name);
        if (this.name == '')
            this.name = 'ERROR';
    }

    //!a functions
    determineA() {
        var sections = this.inputString.split('$');
        if (sections.length == 2) {
            this.alias = sections[1];
            this.removeBeginEndSpace();
            this.name = sections[0].slice(1);
        } else if (sections.length == 1) {
            this.name = sections[0].slice(1);
        }
        return sections.length;
    }
    removeBeginEndSpace() {
        while (this.alias[0] == ' ') {
            this.alias = this.alias.slice(1);
        }
        while (this.alias[this.alias.length-1] == ' ') {
            this.alias = this.alias.slice(0, this.alias.length-1);
        }
    }
    getAliases() {
        var aliases = ah.getAliases(this.name);
        this.output = aliases.output;
        this.name = aliases.name;
        if (this.name == '')
            this.name = 'ERROR';
    }

    //!s functions
    isLetter(str) {
        return (str.toLowerCase() != str.toUpperCase());
    }
    properUpperCase() {
        var i;
        var makeUpperCase = true;
        for (i = 0; i < this.inputString.length; i++) {
            if (makeUpperCase && this.isLetter(this.inputString[i])) {
                this.inputString = this.inputString[i].toUpperCase() + this.inputString.slice(1);
                makeUpperCase = false;
            }
            if (!this.isLetter(this.inputString[i])) {
                makeUpperCase = true;
            }
        }
        console.log(this.inputString);
    }

    //print function
    toString() {
        return 'Name: '+this.name+'\nRarity: '+this.rarity+'\nMerge: '+this.merge+'\nIVs: '+this.boon+'/'+
            this.bane+'\nDFs: '+this.dragonflowers+'\n';
    }

    //Accessors
    getInputString() {
        return this.inputString;
    }
    getCmd() {
        return this.cmd;
    }
    getOutput() {
        return this.output;
    }
    getName() {
        return this.name;
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
        return this.merge;
    }
    getDragonflowers() {
        return this.dragonflowers;
    }
    getReact() {
        return this.react;
    }
}

module.exports = {
    Input: Input
}