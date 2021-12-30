var randomNumber = require("random-number-csprng");

const validParam = (value) => {
    if (value == undefined || value == "" || value == null) return false;
    return true;
};

const getRandomNumber = async (min, max) => {
    return randomNumber(min, max);
};

module.exports = {validParam, getRandomNumber};
