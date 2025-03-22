const axios = require('axios');

//new database api object
const restdb = axios.create({
  baseURL: 'https://reviews-8961.restdb.io/rest',
  headers: {
    'Content-Type': 'application/json',
    'x-apikey': process.env.REST_DB_API_KEY
  }
});

module.exports = restdb;