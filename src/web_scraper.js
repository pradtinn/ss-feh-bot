var axios = require('axios');
var cheerio = require('cheerio');
var unit = require('./unit.js');
var Unit = unit.Unit;

module.exports = {
    getLvl1Stats: function(tableHTML, u) {
        //Put table HTML into cheerio object
        var tableRows = cheerio.load(tableHTML);
        //Get each row from the table
        tableRows('tr').each( function(rowCount=0) {
            if (rowCount == u.getRarity()) {
                //Put row HTML into cheerio object
                var tableColumns = cheerio.load(this);
                var fullStatSpread = [];
                //Get each column from each row
                tableColumns('td').each( function(colCount=0) {
                    if (colCount > 0) {
                        //Split the stat spread for a given stat 
                        var statSpread = tableColumns(this).text().split('/');
                        fullStatSpread.push(statSpread);
                    }
                    colCount++;
                });
                u.setLvl1Stats(fullStatSpread);
            }
            rowCount++;
        });
    },
    getGrowths: function(tableHTML, u) {
        //Put table HTML into cheerio object
        var tableColumns = cheerio.load(tableHTML);
        var growthSpread = [];
        //Get each column from the table
        tableColumns('td').each( function(colCount=0) {
            if (colCount > 0) {
                growthSpread.push(tableColumns(this).text());
            }
            colCount++;
        });
        u.setGrowths(growthSpread);
    },
    getUnitInfo: function(tableHTML, u) {
        var tableColumns = cheerio.load(tableHTML);
        var foundReleaseDate = false;
        var foundMoveType = false;
        var foundWeaponType = false;
        tableColumns('td').each( function(colCount=0) {
            if (colCount > 0 && !foundReleaseDate) {
                var text = tableColumns(this).text();
                text = text.substr(0, text.length-1);
                if (!foundMoveType) {
                    if (u.setMoveType(text.substr(1))) {
                        foundMoveType = true;
                    }
                }
                if (!foundWeaponType) {
                    if (u.setWeaponType(text.substr(1))) {
                        foundWeaponType = true;
                    }
                }
                u.setReleaseDate(text);
                if (!u.getReleaseDate().hasError())
                    foundReleaseDate = true;
            }
            colCount += 1;
        });
    },
    parseSite: async function(url, rarity, boon, bane, merges, dragonflowers) {

        var u = new Unit(url.replace('https://feheroes.gamepedia.com/', ''), rarity, boon, bane, merges, dragonflowers);
        //Store HTML code into result
        var result = await axios.get(url);
        //Put HTML into cheerio object
        var websiteData = cheerio.load(result.data);
        //Get each wikitable default table from the webpage
        var tables = websiteData('table.wikitable');
        var dataIndeces = [1, 3, 0];
        tables.each( function(count=0) {
            if (count == 0) {
                var tableHeader = cheerio.load(this);
                var youMayBeLookingFor = tableHeader('th').text();
                if (youMayBeLookingFor.includes('looking')) {
                    var i;
                    for (i = 0; i < dataIndeces.length; i++) {
                        dataIndeces[i]++;
                    }
                }
            }
            //The second table gives us lvl 1 stats
            if (count == dataIndeces[0]) {
                module.exports.getLvl1Stats(this, u);
            } else if (count == dataIndeces[1]) {
                module.exports.getGrowths(this, u);
            } else if (count == dataIndeces[2]) {
                module.exports.getUnitInfo(this, u);
            }
            count++;
        });
        u.setLvl40Stats();
        return u;
    },
    parseSkill: async function(name) {
        var desc;
        var result = await axios.get('https://feheroes.gamepedia.com/Passives');
        var websiteData = cheerio.load(result.data);
        var tables = websiteData('table.cargoTable');
        var skillType = ['A', 'B', 'C'];
        var found = false;
        tables.each( function(count=0) {
            var tableData = cheerio.load(this);
            var tableRow = tableData('tr');
            tableRow.each( function(rowCount=0) {
                var rowData = cheerio.load(this);
                var tableCol = rowData('td');
                tableCol.each( function(colCount=0) {
                    if (colCount == 1) {
                        var skillName = tableCol(this).text();
                        if (skillName.toLowerCase() == name.toLowerCase())
                            found = true;
                    }
                    if (colCount == 2 && found)
                        return tableCol(this).text();
                    colCount += 1;
                });
                rowCount += 1;
            });
            count += 1;
        });
    }
}