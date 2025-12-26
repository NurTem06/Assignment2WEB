const btn = document.getElementById('get-data-btn');
const resultDiv = document.getElementById('result');

btn.addEventListener('click', async () => {
    btn.textContent = "Загрузка...";
    try {
        const response = await fetch('/api/random-user');
        const data = await response.json();

        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `
            <div class="profile-section">
                <img src="${data.personal.photo}" class="profile-img">
                <div class="info">
                    <h2>${data.personal.name} (${data.personal.gender}, ${data.personal.age} лет)</h2>
                    <p><b>Дата рождения:</b> ${data.personal.dob}</p>
                    <p><b>Адрес:</b> ${data.personal.address}, ${data.personal.city}, ${data.personal.country}</p>
                </div>
            </div>

            <div class="country-section">
                <div class="country-card">
                    <img src="${data.country.flag}" width="100">
                    <h3>Страна: ${data.personal.country}</h3>
                    <p><b>Столица:</b> ${data.country.capital}</p>
                    <p><b>Языки:</b> ${data.country.languages}</p>
                </div>
                <div class="exchange-card">
                    <h3>Курс валюты (${data.country.currency})</h3>
                    <p>1 ${data.country.currency} = <b>${data.exchange.usd} USD</b></p>
                    <p>1 ${data.country.currency} = <b>${data.exchange.kzt} KZT</b></p>
                </div>
            </div>

            <h3>Последние новости (${data.personal.country}):</h3>
            <div class="news-grid">
                ${data.news.map(art => `
                    <div class="news-card">
                        ${art.img ? `<img src="${art.img}">` : ''}
                        <h4>${art.title}</h4>
                        <p>${art.desc || ''}</p>
                        <a href="${art.url}" target="_blank">Читать полностью</a>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        alert("Ошибка при получении данных");
    } finally {
        btn.textContent = "Получить случайного пользователя";
    }
});