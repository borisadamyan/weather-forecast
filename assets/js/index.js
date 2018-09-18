"use strict";

class WeatherForecast {
    constructor() {
        this.daysList = document.getElementById('upcomingDaysList');
        this.citySelect = document.getElementById('citySelect');
        this.forecastContainer = document.getElementById('forecastContainer');
        this.forecastTemplate = document.getElementById('forecastTemplate');
        this.weeklyForecastSummary = document.getElementById('weeklyForecastSummary');
        this.weeklyForecastTemplate = document.getElementById('weeklyForecastTemplate');
        this.citySelect.onchange = this.onSelectCity.bind(this);
        this.fillDaysList();
        this.fillCitySelect();
        this.getForecast();
        this.getWeeklyForecast();
    }

    fillDaysList() {
        this.getDaysData().forEach(day => {
            let item = document.createElement("li");

            let label = document.createElement("label");

            if (day.checked) {
                item.classList.add('active');
                this.selectedDay = day.timestamp;
            }

            let radio = document.createElement("input");
            radio.type = 'radio';
            radio.name = 'checkDay';
            radio.checked = day.checked;
            radio.dataset.timestamp = day.timestamp;
            radio.onchange = this.onCheckDay.bind(this);
            label.appendChild(radio);

            let text = document.createTextNode(day.date);
            label.appendChild(text);

            item.appendChild(label);

            let forecastSummaryContainer = document.createElement("div");
            forecastSummaryContainer.classList.add('hidden');
            forecastSummaryContainer.classList.add('forecast-summary-container');
            item.appendChild(forecastSummaryContainer);

            this.daysList.appendChild(item);
        });
    }

    fillCitySelect() {
        this.getCitiesData().forEach(city => {
            let option = new Option(city.name, city.name, city.selected, city.selected);
            option.dataset.lat = city.lat;
            option.dataset.lng = city.lng;
            this.citySelect.appendChild(option);

            if (city.selected) {
                this.selectedCity = {
                    lat: city.lat,
                    lng: city.lng
                }
            }
        });
    }

    onCheckDay(event) {
        this.daysList.querySelector('.active').classList.remove('active');
        event.target.closest('li').classList.add('active');

        this.selectedDay = event.target.dataset.timestamp;
        this.getForecast();
    }

    onSelectCity(event) {
        this.selectedCity = {
            lat: event.target.selectedOptions[0].dataset.lat,
            lng: event.target.selectedOptions[0].dataset.lng
        };

        this.getForecast();
        this.getWeeklyForecast();
    }

    getDaysData() {
        let days = [];

        for (var i = 0; i <= 7; i++) {
            let currentDate = new Date();
            currentDate.setDate(new Date().getDate() + i);
            let timestamp = Math.round(currentDate / 1000);
            let weekDay = this.getWeekDay(currentDate.getDay());
            let monthDay = currentDate.getDate();

            days.push({
                date: monthDay + " / " +  weekDay,
                timestamp: timestamp,
                checked: i === 0
            });
        }

        return days;
    }

    getWeekDay(index) {
        const weekdays = [
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ];

        return weekdays[index];
    }

    getCitiesData() {
        return [
            {
                name: 'Tbilisi',
                lat: '41.693630',
                lng: '44.801620',
                selected: true
            },
            {
                name: 'Yerevan',
                lat: '40.173970',
                lng: '44.502750',
                selected: false
            },
            {
                name: 'Moscow',
                lat: '55.755871',
                lng: '37.617680',
                selected: false
            }
        ]
    }

    getForecast() {
        this.forecastContainer.classList.add('hidden');
        axios.get(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/bc03464bb581b010dbd146061db815d9/${this.selectedCity.lat},${this.selectedCity.lng},${this.selectedDay}?exclude=currently,flags,hourly&units=si`)
        .then(response => {
            const forecast = response.data.daily.data[0];
            this.showForecast(forecast);
        });
    }

    showForecast(forecast) {
        let template = this.forecastTemplate.innerHTML;

        for (let key in forecast) {
            if (key.endsWith('Time')) {
                forecast[key] = this.getFormattedDate(forecast[key]);
            } else if (key === 'time') {
                forecast[key] = this.getFormattedDateTime(forecast[key]);
            }

            template = template.replace(new RegExp(`%${key}%`), forecast[key]);
        }

        this.forecastContainer.innerHTML = template;
        this.forecastContainer.classList.remove('hidden');
    }

    getFormattedDate(time) {
        let date = new Date(time*1000);
        let hours = this.offsetByZero(date.getHours());
        let minutes = this.offsetByZero(date.getMinutes());

        return hours + ':' + minutes;
    }

    getFormattedDateTime(time) {
        return new Date(time*1000).toLocaleDateString();
    }

    offsetByZero(number) {
        return number > 9 ? number : '0' + number;
    }

    getWeeklyForecast() {
        this.weeklyForecastSummary.classList.add('hidden');
        this.daysList.querySelectorAll('.forecast-summary-container').forEach(element => {
            element.classList.add('hidden');
        });
        axios.get(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/bc03464bb581b010dbd146061db815d9/${this.selectedCity.lat},${this.selectedCity.lng}?exclude=currently,minutely,hourly&units=si`)
            .then(response => {
                this.showWeeklyForecast(response.data.daily.icon, response.data.daily.summary, this.weeklyForecastSummary);
                this.showDailyForecast(response.data.daily.data);
            });
    }

    showDailyForecast(data) {
        const dailyForecastContainer = this.daysList.querySelectorAll('.forecast-summary-container');

        data.forEach((forecast, index) => {
            this.showWeeklyForecast(forecast.icon, forecast.summary, dailyForecastContainer[index]);
        });
    }

    showWeeklyForecast(icon, summary, container) {
        let template = this.weeklyForecastTemplate.innerHTML;
        template = template.replace('%icon%', icon);
        template = template.replace('%summary%', summary);
        container.innerHTML = template;
        container.classList.remove('hidden');
    }

    onInitMap() {
        navigator.geolocation.getCurrentPosition(position => {
            let clientLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            let destinations = [];
            this.getCitiesData().forEach((city) => {
                destinations.push(
                    new google.maps.LatLng(city.lat, city.lng)
                );
            });

            let service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix(
                {
                    origins: [clientLocation],
                    destinations: destinations,
                    travelMode: 'DRIVING'
                }, (response) => {
                    let nearestDistance = response.rows[0].elements[0].distance.value;
                    let nearestIndex = 0;
                    response.rows[0].elements.forEach((point, index) => {
                        if (point.distance.value < nearestDistance) {
                            nearestDistance = point.distance.value;
                            nearestIndex = index;
                        }
                    });
                    this.citySelect.selectedIndex = nearestIndex;
                    this.selectedCity = {
                        lat: this.citySelect[nearestIndex].dataset.lat,
                        lng: this.citySelect[nearestIndex].dataset.lng
                    };

                    this.getForecast();
                    this.getWeeklyForecast();
                });
        });
    }
}

const weatherForecast = new WeatherForecast();

function initMap() {
    weatherForecast.onInitMap();
}