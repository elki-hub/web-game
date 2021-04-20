'use strict';
let crypto = require('crypto');

//Creates a random 12 digit hexadecimal number
let generateSalt = rounds => {
    if (rounds >= 15) {
        throw new Error(`${rounds} is greater than 15,Must be less that 15`);
    }
    if (typeof rounds !== 'number') {
        throw new Error('rounds param must be a number');
    }
    if (rounds == null) {
        rounds = 12;
    }
    return crypto.randomBytes(Math.ceil(rounds / 2)).toString('hex').slice(0, rounds);
};

let hasher = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return {
        salt: salt,
        hashedpassword: value
    };
};

let hash = (password, salt) => {
    if (password == null || salt == null) {
        throw new Error('Must Provide Password and salt values');
    }
    if (typeof password !== 'string' || typeof salt !== 'string') {
        throw new Error('password must be a string and salt must either be a salt string or a number of rounds');
    }
    return hasher(password, salt);
};

//Checks if hash of the salted password is equal to a given hash
let compare = (password, salt, hash) => {
    if (password == null || salt == null || hash == null) {
        throw new Error('password and hash is required to compare');
    }

    let passwordData = hasher(password, salt);
    var passwordDataString = passwordData.hashedpassword.toString();
    var hashString = hash.toString();

    if (passwordDataString == hashString) {
        return true;
    }
    return false
}

module.exports = {
    generateSalt,
    hash,
    compare
}