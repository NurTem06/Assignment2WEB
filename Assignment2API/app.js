require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/api/user", async (req, res) => {
  try {
    const userRes = await axios.get("https://randomuser.me/api/");
    const user = userRes.data.results[0];

    const userData = {
      firstName: user.name.first,
      lastName: user.name.last,
      gender: user.gender,
      age: user.dob.age,
      dob: user.dob.date.split("T")[0],
      picture: user.picture.large,
      city: user.location.city,
      country: user.location.country,
      address: `${user.location.street.name} ${user.location.street.number}`
    };
    const countryRes = await axios.get(
      `https://restcountries.com/v3.1/name/${userData.country}?fullText=true`
    );
    const country = countryRes.data[0];

    const currencyCode = Object.keys(country.currencies || {})[0] || "N/A";

    const countryData = {
      name: country.name.common,
      capital: country.capital?.[0] || "N/A",
      languages: country.languages
        ? Object.values(country.languages).join(", ")
        : "N/A",
      currency: currencyCode,
      flag: country.flags?.png || ""
    };
    let exchangeData = { usd: "N/A", kzt: "N/A" };

    if (process.env.EXCHANGE_API_KEY && currencyCode !== "N/A") {
      try {
        const exchangeRes = await axios.get(
          `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/${currencyCode}`
        );
        const rates = exchangeRes.data.conversion_rates;
        exchangeData = {
          usd: rates?.USD || "N/A",
          kzt: rates?.KZT || "N/A"
        };
      } catch {
        console.log("Exchange API error");
      }
    }
    let news = [];

    if (process.env.NEWS_API_KEY) {
      try {
        const newsRes = await axios.get(
          `https://newsapi.org/v2/everything?q=${userData.country}&language=en&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
        );
        news = newsRes.data.articles.map(a => ({
          title: a.title,
          description: a.description,
          image: a.urlToImage,
          url: a.url
        }));
      } catch {
        console.log("News API error");
      }
    }

    res.json({
      user: userData,
      country: countryData,
      exchange: exchangeData,
      news
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
