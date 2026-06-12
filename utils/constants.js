/**
 * Clo Widgets — Constants
 * Shared constants used across all widgets and managers.
 */

// Extension identity
export const EXTENSION_NAME = 'Clo Widgets';
export const EXTENSION_UUID = 'clo-widgets@mitkumar.dev';

// Panel box positions
export const PanelPosition = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
};

// Widget identifiers
export const WidgetId = {
    CPU: 'cpu',
    MEMORY: 'memory',
    NETSPEED: 'netspeed',
    WEATHER: 'weather',
};

// Default update intervals (seconds)
export const DefaultIntervals = {
    [WidgetId.CPU]: 2,
    [WidgetId.MEMORY]: 3,
    [WidgetId.NETSPEED]: 2,
    [WidgetId.WEATHER]: 600,
};

// System paths
export const SysPath = {
    PROC_STAT: '/proc/stat',
    PROC_MEMINFO: '/proc/meminfo',
    PROC_NET_DEV: '/proc/net/dev',
};

// Weather API (Open-Meteo — no API key required)
export const WeatherAPI = {
    GEOCODE_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    FORECAST_URL: 'https://api.open-meteo.com/v1/forecast',
    IP_LOCATION_URL: 'https://ipapi.co/json/',
};

// WMO Weather condition codes → icon + description
export const WMO_CODES = {
    0:  { icon: 'weather-clear-symbolic',              desc: 'Clear' },
    1:  { icon: 'weather-few-clouds-symbolic',         desc: 'Mostly Clear' },
    2:  { icon: 'weather-few-clouds-symbolic',         desc: 'Partly Cloudy' },
    3:  { icon: 'weather-overcast-symbolic',           desc: 'Overcast' },
    45: { icon: 'weather-fog-symbolic',                desc: 'Fog' },
    48: { icon: 'weather-fog-symbolic',                desc: 'Rime Fog' },
    51: { icon: 'weather-showers-scattered-symbolic',  desc: 'Light Drizzle' },
    53: { icon: 'weather-showers-scattered-symbolic',  desc: 'Drizzle' },
    55: { icon: 'weather-showers-symbolic',            desc: 'Heavy Drizzle' },
    61: { icon: 'weather-showers-scattered-symbolic',  desc: 'Light Rain' },
    63: { icon: 'weather-showers-symbolic',            desc: 'Rain' },
    65: { icon: 'weather-showers-symbolic',            desc: 'Heavy Rain' },
    66: { icon: 'weather-freezing-rain-symbolic',      desc: 'Freezing Rain' },
    67: { icon: 'weather-freezing-rain-symbolic',      desc: 'Heavy Freezing Rain' },
    71: { icon: 'weather-snow-symbolic',               desc: 'Light Snow' },
    73: { icon: 'weather-snow-symbolic',               desc: 'Snow' },
    75: { icon: 'weather-snow-symbolic',               desc: 'Heavy Snow' },
    77: { icon: 'weather-snow-symbolic',               desc: 'Snow Grains' },
    80: { icon: 'weather-showers-symbolic',            desc: 'Rain Showers' },
    81: { icon: 'weather-showers-symbolic',            desc: 'Mod. Rain Showers' },
    82: { icon: 'weather-showers-symbolic',            desc: 'Heavy Rain Showers' },
    85: { icon: 'weather-snow-symbolic',               desc: 'Snow Showers' },
    86: { icon: 'weather-snow-symbolic',               desc: 'Heavy Snow Showers' },
    95: { icon: 'weather-storm-symbolic',              desc: 'Thunderstorm' },
    96: { icon: 'weather-storm-symbolic',              desc: 'T-storm w/ Hail' },
    99: { icon: 'weather-storm-symbolic',              desc: 'T-storm w/ Heavy Hail' },
};

// Color thresholds for usage indicators
export const UsageThreshold = {
    LOW: 40,
    MEDIUM: 70,
    HIGH: 90,
};
