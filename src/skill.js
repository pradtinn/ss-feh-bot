
//skill class

class Skill {
    //skill constructor
    constructor(name) {
        this.name = name;
    }

    //accessors
    getName() {
        return this.name;
    }

    //set name
    setName(newName) {
        this.name = newName;
    }
}

module.exports = {
    Skill: Skill
}