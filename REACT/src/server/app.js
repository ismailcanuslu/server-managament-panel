const express = require('express');
const cors = require('cors');
const app = express();

// CORS ayarları
app.use(cors({
    origin: 'http://localhost:5173', // React uygulamasının adresi
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ... diğer route'lar ve middleware'ler 