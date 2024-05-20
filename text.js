const axios = require('axios');

async function sendTextMessage(phone, message, apiKey) {
    try {
        const response = await axios.post('https://textbelt.com/text', {
            phone: phone,
            message: message,
            key: apiKey
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response ? error.response.data.error : error.message);
    }
}

module.exports = { sendTextMessage };
