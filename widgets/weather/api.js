/**
 * Clo Widgets — Weather API
 * Uses Open-Meteo (free, no API key) for weather data and ip-api for geolocation.
 */

import { httpGet } from '../../utils/helpers.js';
import { WeatherAPI } from '../../utils/constants.js';
import * as Log from '../../utils/logger.js';

/**
 * Get latitude/longitude from IP address.
 * @returns {Promise<{lat: number, lon: number, city: string}>}
 */
export async function getLocationFromIP() {
    try {
        const raw = await httpGet(WeatherAPI.IP_LOCATION_URL);
        const data = JSON.parse(raw);
        return { lat: data.latitude, lon: data.longitude, city: data.city || 'Unknown' };
    } catch (e) {
        Log.error('Failed to get location from IP:', e.message);
        return null;
    }
}

/**
 * Geocode a city name to lat/lon.
 * @param {string} cityName
 * @returns {Promise<{lat: number, lon: number, city: string}|null>}
 */
export async function geocodeCity(cityName) {
    try {
        const url = `${WeatherAPI.GEOCODE_URL}?name=${encodeURIComponent(cityName)}&count=1`;
        const raw = await httpGet(url);
        const data = JSON.parse(raw);
        if (data.results && data.results.length > 0) {
            const r = data.results[0];
            return { lat: r.latitude, lon: r.longitude, city: r.name };
        }
        return null;
    } catch (e) {
        Log.error('Geocoding failed:', e.message);
        return null;
    }
}

/**
 * Fetch current weather for given coordinates.
 * @param {number} lat
 * @param {number} lon
 * @param {string} units - 'metric' or 'imperial'
 * @returns {Promise<object|null>}
 */
export async function fetchWeather(lat, lon, units = 'metric') {
    try {
        const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
        const url = `${WeatherAPI.FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
            `&temperature_unit=${tempUnit}&wind_speed_unit=kmh`;
        const raw = await httpGet(url);
        return JSON.parse(raw);
    } catch (e) {
        Log.error('Weather fetch failed:', e.message);
        return null;
    }
}
