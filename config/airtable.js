const axios = require('axios');
require('dotenv').config();

const airtable = axios.create({
  baseURL: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
  },
});

module.exports = airtable;
