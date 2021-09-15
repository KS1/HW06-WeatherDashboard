// script for weather dashboard application

var cityInput = document.querySelector('#city-input');
var cityBtn = document.querySelector('#search-btn');
var cityNameEl = document.querySelector('#city-name');
var cityArr = [];

// set api key
var apiKey = '400a5cae84cd4ce01fdd89b862f1e430'; 

var formHandler = function(event) {
    // formats city name
    var selectedCity = cityInput
        .value
        .trim()
        .toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');

    if (selectedCity) {
        getCoords(selectedCity);
        cityInput.value = '';
    } else {
        alert('Please enter a city!');
    };
};

// use 'current weather api' to fetch latitude and longitude
var getCoords = function(city) {
    // Used template literal for URL
    var currentWeatherApi = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`;

    fetch(currentWeatherApi).then(function(response) {
        if (response.ok) {
            response.json().then(function(data) { 
                var lon = data.coord['lon'];
                var lat = data.coord['lat'];

                // get city forecast
                getCityForecast(city, lon, lat);

                // saves searched city and refreshes recent city list
                if (document.querySelector('.city-list')) {
                    document.querySelector('.city-list').remove();
                }

                // save city
                saveCity(city);
                // load cities
                loadCities();
            });
        } else {
            alert(`Error: ${response.statusText}`)
        }
    })
    .catch(function(error) {
        alert('Unable to load weather.');
    })
}

// use latitude and longitude to fetch current weather and five-day forecast
var getCityForecast = function(city, lon, lat) {
    var oneCallApi = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,hourly,alerts&appid=${apiKey}`;
    fetch(oneCallApi).then(function(response) {
        if (response.ok) {
            response.json().then(function(data) {

                // identify city name in forecast
                cityNameEl.textContent = `${city} (${moment().format("M/D/YYYY")})`; 

                currentForecast(data);
                fiveDayForecast(data);
            });
        }
    })
}

// helper function to select HTML element and display rounded temperature
var displayTemp = function(element, temperature) {
    var tempEl = document.querySelector(element);
    var elementText = Math.round(temperature);
    tempEl.textContent = elementText;
}

// display current forecast
var currentForecast = function(forecast) {
    
    var forecastEl = document.querySelector('.city-forecast');
    forecastEl.classList.remove('hide');

    // set today's weather icon
    var weatherIconEl = document.querySelector('#today-icon');
    var currentIcon = forecast.current.weather[0].icon;
    weatherIconEl.setAttribute('src', `http://openweathermap.org/img/wn/${currentIcon}.png`);
    weatherIconEl.setAttribute('alt', forecast.current.weather[0].main)

    // set current temparature
    displayTemp('#current-temp', forecast.current['temp']);
    displayTemp('#current-feels-like', forecast.current['feels_like']);
    displayTemp('#current-high', forecast.daily[0].temp.max);
    displayTemp('#current-low', forecast.daily[0].temp.min);

    // set current weather condition
    var currentConditionEl = document.querySelector('#current-condition');
    currentConditionEl.textContent = forecast.current.weather[0].description
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');

    // set humidity
    var currentHumidityEl = document.querySelector('#current-humidity');
    currentHumidityEl.textContent = forecast.current['humidity'];

    // set wind-speed
    var currentWindEl = document.querySelector('#current-wind-speed')
    currentWindEl.textContent = forecast.current['wind_speed'];

    // set uv index
    var uviEl = document.querySelector('#current-uvi')
    var currentUvi = forecast.current['uvi'];
    uviEl.textContent = currentUvi;

    // style UV index
    switch (true) {
        case (currentUvi <= 2):
            uviEl.className = 'badge badge-success';
            break;
        case (currentUvi <= 5):
            uviEl.className = 'badge badge-warning';
            break;
        case (currentUvi <=7):
            uviEl.className = 'badge badge-danger';
            break;
        default:
            uviEl.className = 'badge text-light';
            uviEl.setAttribute('style', 'background-color: #553C7B');
    }
}

// display five day forecast
var fiveDayForecast = function(forecast) { 
    
    for (var i = 1; i < 6; i++) {
        var dateP = document.querySelector('#date-' + i);
        dateP.textContent = moment().add(i, 'days').format('M/D/YYYY');

        var iconImg = document.querySelector('#icon-' + i);
        var iconCode = forecast.daily[i].weather[0].icon;
        iconImg.setAttribute('src', `http://openweathermap.org/img/wn/${iconCode}.png`);
        iconImg.setAttribute('alt', forecast.daily[i].weather[0].main);

        displayTemp('#temp-' + i, forecast.daily[i].temp.day);
        displayTemp('#high-' + i, forecast.daily[i].temp.max);
        displayTemp('#low-' + i, forecast.daily[i].temp.min);

        var humiditySpan = document.querySelector('#humidity-' + i);
        humiditySpan.textContent = forecast.daily[i].humidity;
    }
}

// save cities into local storage
var saveCity = function(city) {

    // prevent duplicate city from being saved and move it to end of array
    for (var i = 0; i < cityArr.length; i++) {
        if (city === cityArr[i]) {
            cityArr.splice(i, 1);
        }
    }

    cityArr.push(city);
    localStorage.setItem('cities', JSON.stringify(cityArr));
}

// load cities from local storage
var loadCities = function() {
    cityArr = JSON.parse(localStorage.getItem('cities'));

    if (!cityArr) {
        cityArr = [];
        return false;
    } else if (cityArr.length > 5) {
        // save only the five most recent cities
        cityArr.shift();
    }

    // set recent cities
    var recentCities = document.querySelector('#recent-cities');
    var cityListUl = document.createElement('ul');
    cityListUl.className = 'list-group list-group-flush city-list';
    recentCities.appendChild(cityListUl);

    for (var i = 0; i < cityArr.length; i++) {
        var cityListItem = document.createElement('button');
        cityListItem.setAttribute('type', 'button');
        cityListItem.className = 'list-group-item';
        cityListItem.setAttribute('value', cityArr[i]);
        cityListItem.textContent = cityArr[i];
        cityListUl.prepend(cityListItem);
    }

    var cityList = document.querySelector('.city-list');
    cityList.addEventListener('click', selectRecent)
}

var selectRecent = function(event) {
    var clickedCity = event.target.getAttribute('value');

    // get co-ordinates
    getCoords(clickedCity);
}

// call load cities function on page load
loadCities();

// set event listener for city button
cityBtn.addEventListener('click', formHandler)

// searche for city on ENTER key
cityInput.addEventListener('keyup', function(event) {
    if (event.keyCode === 13) {
        cityBtn.click();
    }
});

