const apiKey = "052f3f3bdd405b2772fe5dc5c3e8462f"; // Replace with your valid OpenWeatherMap key

// DOM elements
const cityInput = document.getElementById('cityInput');
const getWeatherBtn = document.getElementById('getWeather');
const weatherCard = document.getElementById('weatherCard');
const cityNameEl = document.getElementById('cityName');
const tempEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const descEl = document.getElementById('description');
const iconEl = document.getElementById('weatherIcon');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const loader = document.getElementById('loader');
const historyDropdown = document.getElementById('historyDropdown');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');
const hourlyForecast = document.getElementById('hourlyForecast');

let unit = "metric"; // default °C
let unitSymbol = "°C";

// Save and load search history
function saveHistory(city){
  let history = JSON.parse(localStorage.getItem('cityHistory')) || [];
  if(!history.includes(city)){
    history.unshift(city);
    if(history.length>5) history.pop();
    localStorage.setItem('cityHistory', JSON.stringify(history));
    updateDropdown();
  }
}

function updateDropdown(){
  let history = JSON.parse(localStorage.getItem('cityHistory')) || [];
  historyDropdown.innerHTML = `<option value="">Previous Searches</option>`;
  history.forEach(city => {
    historyDropdown.innerHTML += `<option value="${city}">${city}</option>`;
  });
}

// Fetch weather data
function fetchWeather(cityName = null){
  const city = cityName || cityInput.value.trim();
  if(!city) return;

  loader.classList.remove('hidden');
  weatherCard.classList.add('hidden');
  hourlyForecast.classList.add('hidden');

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      loader.classList.add('hidden');
      if(data.cod != 200){
        weatherCard.classList.remove('hidden');
        weatherCard.innerHTML = `<p class="error">City not found or invalid API key</p>`;
        return;
      }

      // Populate weather card
      cityNameEl.innerText = data.name;
      tempEl.innerText = data.main.temp + unitSymbol;
      humidityEl.innerText = data.main.humidity;
      windEl.innerText = data.wind.speed;
      descEl.innerText = data.weather[0].description;
      iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      sunriseEl.innerText = new Date(data.sys.sunrise*1000).toLocaleTimeString();
      sunsetEl.innerText = new Date(data.sys.sunset*1000).toLocaleTimeString();

      weatherCard.classList.remove('hidden');
      saveHistory(city);

      // Background based on weather
      let mainWeather = data.weather[0].main.toLowerCase();
      const body = document.querySelector('.app-container');
      if(mainWeather.includes("cloud")) body.style.backgroundImage = "url('../assets/cloudy2.jpg')";
      else if(mainWeather.includes("rain")) body.style.backgroundImage = "url('../assets/rainy.jpg')";
      else body.style.backgroundImage = "url('../assets/sunny1.jpg')";

      // Fetch hourly forecast
      fetchHourlyForecast(data.coord.lat, data.coord.lon);
    })
    .catch(err => {
      loader.classList.add('hidden');
      weatherCard.classList.remove('hidden');
      weatherCard.innerHTML = `<p class="error">Something went wrong. Check console.</p>`;
      console.error(err);
    });
}

// Fetch hourly forecast
function fetchHourlyForecast(lat, lon){
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      hourlyForecast.innerHTML = "";
      data.list.slice(0, 12).forEach(hour => {
        const time = new Date(hour.dt*1000).getHours() + ":00";
        hourlyForecast.innerHTML += `
          <div class="hour-card">
            <p>${time}</p>
            <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="">
            <p>${hour.main.temp}${unitSymbol}</p>
          </div>`;
      });
      hourlyForecast.classList.remove('hidden');
    });
}

// Event listeners
getWeatherBtn.addEventListener('click', ()=>fetchWeather());
cityInput.addEventListener('keypress', e => { if(e.key === 'Enter') fetchWeather(); });
historyDropdown.addEventListener('change', e => { if(e.target.value) fetchWeather(e.target.value); });

// °C / °F toggle
celsiusBtn.addEventListener('click', ()=>{
  unit = "metric"; unitSymbol="°C";
  celsiusBtn.classList.add('active'); fahrenheitBtn.classList.remove('active');
  if(cityInput.value) fetchWeather();
});
fahrenheitBtn.addEventListener('click', ()=>{
  unit = "imperial"; unitSymbol="°F";
  fahrenheitBtn.classList.add('active'); celsiusBtn.classList.remove('active');
  if(cityInput.value) fetchWeather();
});

// Load search history on start
updateDropdown();