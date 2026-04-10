const axios = require('axios');
const API_BASE_URL = 'https://api.coingecko.com/api/v3';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await axios.get(`${API_BASE_URL}/coins/markets`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'API Error' });
  }
};
