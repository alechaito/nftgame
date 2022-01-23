var randomNumber = require("random-number-csprng");

const validParam = (value) => {
    if (value == undefined || value == "" || value == null) return false;
    return true;
};

const getRandomNumber = async (min, max) => {
    return randomNumber(min, max);
};

const getDeltaTimeFromNow = async (date) => {
    try {
        //date needs to be a Date() object
        let now = parseInt(new Date().getTime());
        let fromTime = parseInt(date.getTime());
        console.log((now - fromTime) / 1000 / 60 / 60 / 24);
        return Math.floor((now - fromTime) / 1000 / 60 / 60 / 24);
    } catch (error) {
        console.log(error);
        return 0;
    }
};

const getNonce = async () => {
    return await getRandomNumber(1000, 9999);
};

module.exports = { validParam, getRandomNumber, getDeltaTimeFromNow, getNonce };
