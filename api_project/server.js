const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы из папки public
app.use(express.static('public'));

app.get('/api/random-user', async (req, res) => {
    try {
        console.log("Получен запрос на генерацию пользователя...");

        // 1. Random User API
        const userRes = await axios.get('https://randomuser.me/api/');
        const user = userRes.data.results[0];
        const countryName = user.location.country;
        
        console.log(`Пользователь найден. Страна: ${countryName}`);

        // 2. REST Countries API
        // Используем блок try-catch внутри, чтобы ошибка в одном API не ломала всё
        let countryData = {};
        let currencyCode = 'USD'; // По умолчанию
        try {
            const countryRes = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);
            countryData = countryRes.data[0];
            currencyCode = Object.keys(countryData.currencies)[0];
        } catch (e) { console.error("Ошибка в Countries API:", e.message); }

        // 3. Exchange Rate API
        let rates = { USD: 1, KZT: 0 };
        try {
            const exchangeKey = process.env.EXCHANGE_KEY;
            const rateRes = await axios.get(`https://v6.exchangerate-api.com/v6/${exchangeKey}/latest/${currencyCode}`);
            rates.USD = rateRes.data.conversion_rates.USD;
            rates.KZT = rateRes.data.conversion_rates.KZT;
        } catch (e) { console.error("Ошибка в Exchange API:", e.message); }

        // 4. News API (ищем новости по названию страны)
        let articles = [];
        try {
            const newsKey = process.env.NEWS_API_KEY;
            const newsRes = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(countryName)}&language=en&pageSize=5&apiKey=${newsKey}`);
            articles = newsRes.data.articles.map(a => ({
                title: a.title,
                img: a.urlToImage,
                desc: a.description,
                url: a.url
            }));
        } catch (e) { console.error("Ошибка в News API:", e.message); }

        // Собираем итоговый ответ
        const finalData = {
            personal: {
                name: `${user.name.first} ${user.name.last}`,
                gender: user.gender,
                photo: user.picture.large,
                age: user.dob.age,
                dob: new Date(user.dob.date).toLocaleDateString(),
                city: user.location.city,
                country: countryName,
                address: `${user.location.street.number} ${user.location.street.name}`
            },
            country: {
                capital: countryData.capital ? countryData.capital[0] : "N/A",
                languages: countryData.languages ? Object.values(countryData.languages).join(', ') : "N/A",
                currency: currencyCode,
                flag: countryData.flags ? countryData.flags.png : ""
            },
            exchange: {
                base: currencyCode,
                usd: rates.USD,
                kzt: rates.KZT
            },
            news: articles
        };

        res.json(finalData);

    } catch (error) {
        console.error("Глобальная ошибка сервера:", error.message);
        res.status(500).json({ error: "Ошибка сервера при сборе данных" });
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Сервер успешно запущен!`);
    console.log(`Адрес: http://localhost:${PORT}`);
    console.log(`=========================================`);
});