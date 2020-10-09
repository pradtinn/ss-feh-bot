const aliasHandler = require('./alias_handler.js');
//input class for formatting the input and getting useful data from it

class Input {
    constructor(input) {
        //<cmd> <rarity> <unitname>+<merges>/<boon><bane>|<dragonflowers>
        this.inputString = input;
        this.output = '';
        this.cmd = input.substr(0, input.indexOf(' '));
        if (input.indexOf(' ') == -1) {
            this.cmd = input;
        }
        this.inputString = this.inputString.slice(input.indexOf(' '));
        this.rarity = 5;
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
                if (this.name == 'None')
                    this.name = 'ERROR';
            }
            break;
            case 'a': {
                var numSections = this.determineA();
                if (numSections == 2) {
                    if (this.name.indexOf('$') != -1 || !aliasHandler.filterAlias(this.alias)) {
                        this.name = 'ERROR';
                    }
                }
            }
            break;
            case 'ra': {
                var sections = this.inputString.split('$');
                if (sections.length == 1) {
                    this.name = sections[0].slice(1);
                    if (this.name.toLowerCase() == 'none') {
                        this.name = 'ERROR';
                    }
                }
            }
            break;
            case 'w':
            case 'gib':
            case 'sd': {
                var sections = this.inputString.split(' ');
                this.inputString = sections.join(' ');
                this.inputString = this.removeBeginEndSpace(this.inputString);
            }
            break;
            case 'update': {
                this.determineA();
            }
        }
    }

    //!h functions
    //inserts spaces in the input to normalize it
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
    //get unit parameters from the input
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
    //turn raw iv data into actual string representations
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
    //check if values given are valid
    verifyValues(name) {
        if (isNaN(this.rarity) || this.rarity < 1 || this.rarity > 5)
            this.rarity = 5;
        if (isNaN(this.merge) || this.merge < 0 || this.merge > 10)
            this.merge = 0;
        if ((this.boon == '' || this.bane == '' && this.merge < 1) || this.boon == this.bane) {
            this.boon = '';
            this.bane = '';
        }
        if (isNaN(this.dragonflowers) || this.dragonflowers < 0)
            this.dragonflowers = 0;
        else if (this.dragonflowers > 15)
            this.dragonflowers = 15;
        this.name = name;
        if (this.name == null)
            this.name = 'ERROR';
    }

    //!a functions
    //determine if setting an alias or requesting the list of aliases, then parsing the info
    determineA() {
        var sections = this.inputString.split('$');
        if (sections.length == 2) {
            this.alias = sections[1];
            this.alias = this.removeBeginEndSpace(this.alias);
            this.name = sections[0].slice(1);
        } else if (sections.length == 1) {
            this.name = sections[0].slice(1);
        }
        return sections.length;
    }
    //helper function to remove excess spaces
    removeBeginEndSpace(str) {
        while (str[0] == ' ') {
            str = str.slice(1);
        }
        while (str[str.length-1] == ' ') {
            str = str.slice(0, str.length-1);
        }
        return str;
    }
    //get aliases from alias file
    getAlias() {
        return this.alias;
    }

    //print function for debugging
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
}

module.exports = {
    Input: Input
}