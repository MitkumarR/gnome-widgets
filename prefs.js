/**
 * Clo Widgets — Preferences
 * Settings UI using libadwaita PreferencesWindow.
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CloWidgetsPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // ── General page ────────────────────────────────────────
        const generalPage = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });

        const posGroup = new Adw.PreferencesGroup({
            title: _('Panel Position'),
            description: _('Where widgets appear in the top panel'),
        });

        const posRow = new Adw.ComboRow({
            title: _('Position'),
            subtitle: _('Left, Center, or Right side of the top panel'),
            model: Gtk.StringList.new(['left', 'center', 'right']),
        });

        // Set current value
        const currentPos = settings.get_string('panel-position');
        const posMap = { 'left': 0, 'center': 1, 'right': 2 };
        posRow.set_selected(posMap[currentPos] ?? 2);

        posRow.connect('notify::selected', () => {
            const vals = ['left', 'center', 'right'];
            settings.set_string('panel-position', vals[posRow.get_selected()]);
        });

        posGroup.add(posRow);
        generalPage.add(posGroup);
        window.add(generalPage);

        // ── CPU page ────────────────────────────────────────────
        const cpuPage = new Adw.PreferencesPage({
            title: _('CPU'),
            icon_name: 'utilities-system-monitor-symbolic',
        });

        const cpuGroup = new Adw.PreferencesGroup({
            title: _('CPU Monitor'),
            description: _('Display CPU usage in the top panel'),
        });

        const cpuSwitch = new Adw.SwitchRow({ title: _('Enable'), subtitle: _('Show CPU widget') });
        settings.bind('cpu-enabled', cpuSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const cpuIconSwitch = new Adw.SwitchRow({ title: _('Show Icon'), subtitle: _('Display icon next to value') });
        settings.bind('cpu-show-icon', cpuIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const cpuInterval = new Adw.SpinRow({
            title: _('Update Interval'),
            subtitle: _('Seconds between updates'),
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 30, step_increment: 1, value: settings.get_int('cpu-update-interval') }),
        });
        settings.bind('cpu-update-interval', cpuInterval, 'value', Gio.SettingsBindFlags.DEFAULT);

        cpuGroup.add(cpuSwitch);
        cpuGroup.add(cpuIconSwitch);
        cpuGroup.add(cpuInterval);
        cpuPage.add(cpuGroup);
        window.add(cpuPage);

        // ── Memory page ─────────────────────────────────────────
        const memPage = new Adw.PreferencesPage({
            title: _('Memory'),
            icon_name: 'drive-harddisk-symbolic',
        });

        const memGroup = new Adw.PreferencesGroup({
            title: _('Memory Monitor'),
            description: _('Display RAM usage in the top panel'),
        });

        const memSwitch = new Adw.SwitchRow({ title: _('Enable'), subtitle: _('Show Memory widget') });
        settings.bind('memory-enabled', memSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const memIconSwitch = new Adw.SwitchRow({ title: _('Show Icon'), subtitle: _('Display icon next to value') });
        settings.bind('memory-show-icon', memIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const memInterval = new Adw.SpinRow({
            title: _('Update Interval'),
            subtitle: _('Seconds between updates'),
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 30, step_increment: 1, value: settings.get_int('memory-update-interval') }),
        });
        settings.bind('memory-update-interval', memInterval, 'value', Gio.SettingsBindFlags.DEFAULT);

        memGroup.add(memSwitch);
        memGroup.add(memIconSwitch);
        memGroup.add(memInterval);
        memPage.add(memGroup);
        window.add(memPage);

        // ── Network page ────────────────────────────────────────
        const netPage = new Adw.PreferencesPage({
            title: _('Network'),
            icon_name: 'network-transmit-receive-symbolic',
        });

        const netGroup = new Adw.PreferencesGroup({
            title: _('Network Speed'),
            description: _('Display upload/download speed in the top panel'),
        });

        const netSwitch = new Adw.SwitchRow({ title: _('Enable'), subtitle: _('Show Network widget') });
        settings.bind('netspeed-enabled', netSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const netIconSwitch = new Adw.SwitchRow({ title: _('Show Icon'), subtitle: _('Display icon next to values') });
        settings.bind('netspeed-show-icon', netIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const netInterval = new Adw.SpinRow({
            title: _('Update Interval'),
            subtitle: _('Seconds between updates'),
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 30, step_increment: 1, value: settings.get_int('netspeed-update-interval') }),
        });
        settings.bind('netspeed-update-interval', netInterval, 'value', Gio.SettingsBindFlags.DEFAULT);

        netGroup.add(netSwitch);
        netGroup.add(netIconSwitch);
        netGroup.add(netInterval);
        netPage.add(netGroup);
        window.add(netPage);

        // ── Weather page ────────────────────────────────────────
        const wxPage = new Adw.PreferencesPage({
            title: _('Weather'),
            icon_name: 'weather-few-clouds-symbolic',
        });

        const wxGroup = new Adw.PreferencesGroup({
            title: _('Weather'),
            description: _('Display current weather in the top panel'),
        });

        const wxSwitch = new Adw.SwitchRow({ title: _('Enable'), subtitle: _('Show Weather widget') });
        settings.bind('weather-enabled', wxSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const wxIconSwitch = new Adw.SwitchRow({ title: _('Show Icon'), subtitle: _('Display weather icon') });
        settings.bind('weather-show-icon', wxIconSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const wxLocation = new Adw.EntryRow({ title: _('Location'), text: settings.get_string('weather-location') });
        wxLocation.connect('changed', () => {
            settings.set_string('weather-location', wxLocation.get_text());
        });

        const wxUnits = new Adw.ComboRow({
            title: _('Units'),
            subtitle: _('Temperature unit'),
            model: Gtk.StringList.new(['metric', 'imperial']),
        });
        const curUnit = settings.get_string('weather-units');
        wxUnits.set_selected(curUnit === 'imperial' ? 1 : 0);
        wxUnits.connect('notify::selected', () => {
            settings.set_string('weather-units', wxUnits.get_selected() === 1 ? 'imperial' : 'metric');
        });

        const wxInterval = new Adw.SpinRow({
            title: _('Update Interval'),
            subtitle: _('Seconds between weather refreshes'),
            adjustment: new Gtk.Adjustment({ lower: 60, upper: 3600, step_increment: 60, value: settings.get_int('weather-update-interval') }),
        });
        settings.bind('weather-update-interval', wxInterval, 'value', Gio.SettingsBindFlags.DEFAULT);

        wxGroup.add(wxSwitch);
        wxGroup.add(wxIconSwitch);
        wxGroup.add(wxLocation);
        wxGroup.add(wxUnits);
        wxGroup.add(wxInterval);
        wxPage.add(wxGroup);
        window.add(wxPage);

        window.set_default_size(500, 600);
    }
}