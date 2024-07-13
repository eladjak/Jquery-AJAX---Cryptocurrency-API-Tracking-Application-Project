const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// CORS setting
app.use(cors({
  origin: '*', // Acsess to every domain. can be changed to your domain.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const API_BASE_URL = 'https://api.coingecko.com/api/v3';

app.get('/api/coins/markets', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/coins/markets`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

app.get('/api/coins/:id', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/coins/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

app.get('/api/coins/:id/market_chart', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/coins/${req.params.id}/market_chart`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

const PORT = process.env.PORT || 54187; // שינוי הפורט ל-54187
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});