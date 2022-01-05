const fs = require('fs');

const PAYMASTER_JSON = `${__dirname}/../paymaster.json`;

module.exports.getPaymasterDetails = () => {
    if (fs.existsSync(PAYMASTER_JSON)) {
        return require(PAYMASTER_JSON);
    }
}

module.exports.savePaymasterDetails = (paymaster) => {
    fs.writeFileSync(PAYMASTER_JSON, JSON.stringify(paymaster));
}