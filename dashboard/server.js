// Dashboard cho CEO - backend toi gian
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const GATEWAY = process.env.GATEWAY_URL || 'http://kong:8000';

// Lay tom tat tu Integration Service, di qua Gateway
app.get('/api/summary', async (req, res) => {
  try {
    const { data } = await axios.get(`${GATEWAY}/api/v1/dashboard/summary`, { timeout: 4000 });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Khong goi duoc Integration Service', detail: err.message });
  }
});

// Nut "Chay kich ban" tren giao dien goi vao day
app.post('/api/run/:scenario', async (req, res) => {
  const s = req.params.scenario;
  try {
    if (s === 'stock') {
      const { data } = await axios.get(`${GATEWAY}/api/v1/products/SKU123/stock`);
      return res.json({ ok: true, result: data });
    }
    if (s === 'order') {
      const { data } = await axios.post(`${GATEWAY}/api/v1/orders`, {
        customerId: 'CUS-001',
        items: [{ sku: 'SKU123', quantity: 2 }]
      });
      return res.json({ ok: true, result: data });
    }
    if (s === 'ratelimit') {
      const codes = [];
      for (let i = 0; i < 30; i++) {
        try {
          const r = await axios.get(`${GATEWAY}/api/v1/products/SKU123/stock`);
          codes.push(r.status);
        } catch (e) { codes.push(e.response?.status || 0); }
      }
      return res.json({ ok: true, result: { codes, so429: codes.filter(c => c === 429).length } });
    }
    res.status(400).json({ error: 'Kich ban khong hop le' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.response?.data || err.message });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => console.log(`[dashboard] dang chay o cong ${PORT}`));
