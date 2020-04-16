//date class

class Date {
    constructor(stringForm) {
        var dateArr = stringForm.split('-');
        var dateArrInt = Array(dateArr.length);
        var i;
        for (i = 0; i < dateArr.length; i++) {
            dateArrInt[i] = parseInt(dateArr[i], 10);
            if (isNaN(dateArrInt[i])) {
                this.err = true;
                break;
            }
        }
        this.year;
        this.month;
        this.day;
        this.err;
        if (dateArrInt.length != 3 || this.err) {
            this.err = true;
        } else {
            this.year = dateArrInt[0];
            this.month = dateArrInt[1];
            this.day = dateArrInt[2];
            this.err = false;
        }
    }
    getYear() {
        return this.year;
    }
    getMonth() {
        return this.month;
    }
    getDay() {
        return this.day;
    }
    hasError() {
        return this.err;
    }
    compare(date) {
        if (this.year != date.year)
            return this.year - date.year;
        if (this.month != date.month)
            return this.month - date.month;
        if (this.day != date.day)
            return this.day - date.day;
        return 0;
    }
}

module.exports = {
    Date: Date
}