/**
 * Clo Widgets — Weather Widget
 * Displays current temperature and weather condition in the top panel.
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { WMO_CODES } from '../../utils/constants.js';
import * as Log from '../../utils/logger.js';
import { getLocationFromIP, geocodeCity, fetchWeather } from './api.js';

const WeatherIndicator = GObject.registerClass(
class WeatherIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Clo Weather Widget', false);

        this._box = new St.BoxLayout({
            style_class: 'clo-widget-box clo-weather-box',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._box);

        this._icon = new St.Icon({
            icon_name: 'weather-clear-symbolic',
            style_class: 'clo-widget-icon',
        });
        this._box.add_child(this._icon);

        this._label = new St.Label({
            text: '…',
            style_class: 'clo-widget-label clo-weather-label',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._box.add_child(this._label);

        // Popup
        const headerItem = new PopupMenu.PopupMenuItem('Weather', { reactive: false, style_class: 'clo-popup-header' });
        this.menu.addMenuItem(headerItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._locationItem = new PopupMenu.PopupMenuItem('Location: …', { reactive: false });
        this._conditionItem = new PopupMenu.PopupMenuItem('Condition: …', { reactive: false });
        this._feelsLikeItem = new PopupMenu.PopupMenuItem('Feels like: …', { reactive: false });
        this._humidityItem = new PopupMenu.PopupMenuItem('Humidity: …', { reactive: false });
        this._windItem = new PopupMenu.PopupMenuItem('Wind: …', { reactive: false });

        this.menu.addMenuItem(this._locationItem);
        this.menu.addMenuItem(this._conditionItem);
        this.menu.addMenuItem(this._feelsLikeItem);
        this.menu.addMenuItem(this._humidityItem);
        this.menu.addMenuItem(this._windItem);
    }

    setWeather(data, city, units) {
        const current = data.current;
        const temp = Math.round(current.temperature_2m);
        const unit = units === 'imperial' ? '°F' : '°C';
        const code = current.weather_code;
        const wmo = WMO_CODES[code] || WMO_CODES[0];

        this._icon.icon_name = wmo.icon;
        this._label.set_text(`${temp}${unit}`);

        this._locationItem.label.set_text(`📍 ${city}`);
        this._conditionItem.label.set_text(`${wmo.desc}`);
        this._feelsLikeItem.label.set_text(`Feels like: ${Math.round(current.apparent_temperature)}${unit}`);
        this._humidityItem.label.set_text(`Humidity: ${current.relative_humidity_2m}%`);
        this._windItem.label.set_text(`Wind: ${current.wind_speed_10m} km/h`);
    }

    setError(msg) {
        this._label.set_text('--');
        this._locationItem.label.set_text(msg);
    }

    setIconVisible(visible) { this._icon.visible = visible; }
});

export class WeatherWidget {
    constructor(settings, extension) {
        this._settings = settings;
        this._extension = extension;
        this._indicator = null;
        this._timerId = null;
        this._location = null;
    }

    get indicator() { return this._indicator; }

    enable() {
        this._indicator = new WeatherIndicator();
        this._indicator.setIconVisible(this._settings.getBool('weather-show-icon'));

        this._settings.connect('weather-show-icon', () => {
            this._indicator?.setIconVisible(this._settings.getBool('weather-show-icon'));
        });
        this._settings.connect('weather-update-interval', () => this._restartTimer());
        this._settings.connect('weather-location', () => {
            this._location = null;
            this._fetchData();
        });
        this._settings.connect('weather-units', () => this._fetchData());

        this._startTimer();
        Log.info('Weather widget enabled');
    }

    disable() {
        this._stopTimer();
        this._indicator = null;
        this._location = null;
        Log.info('Weather widget disabled');
    }

    _startTimer() {
        this._fetchData();
        const interval = this._settings.getInt('weather-update-interval');
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, () => {
            this._fetchData();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _stopTimer() {
        if (this._timerId) { GLib.Source.remove(this._timerId); this._timerId = null; }
    }

    _restartTimer() { this._stopTimer(); this._startTimer(); }

    async _fetchData() {
        try {
            if (!this._location) {
                const locSetting = this._settings.getString('weather-location');
                if (locSetting === 'auto') {
                    this._location = await getLocationFromIP();
                } else {
                    this._location = await geocodeCity(locSetting);
                }
            }
            if (!this._location) {
                this._indicator?.setError('Location not found');
                return;
            }

            const units = this._settings.getString('weather-units');
            const data = await fetchWeather(this._location.lat, this._location.lon, units);
            if (data && data.current)
                this._indicator?.setWeather(data, this._location.city, units);
            else
                this._indicator?.setError('No weather data');
        } catch (e) {
            Log.error('Weather update failed:', e.message);
            this._indicator?.setError('Error');
        }
    }
}
