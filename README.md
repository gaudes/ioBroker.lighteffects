![Logo](admin/lighteffects.png)

# ioBroker.lighteffects

[![NPM version](http://img.shields.io/npm/v/iobroker.lighteffects.svg)](https://www.npmjs.com/package/iobroker.lighteffects)
[![Downloads](https://img.shields.io/npm/dm/iobroker.lighteffects.svg)](https://www.npmjs.com/package/iobroker.lighteffects)
![Number of Installations (latest)](https://iobroker.live/badges/lighteffects-installed.svg)
![Number of Installations (stable)](https://iobroker.live/badges/lighteffects-stable.svg)
![Test and Release](https://github.com/gaudes/ioBroker.lighteffects/workflows/Test%20and%20Release/badge.svg)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/lighteffects/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)

[![NPM](https://nodei.co/npm/iobroker.lighteffects.png?downloads=true)](https://nodei.co/npm/iobroker.lighteffects/)

## LightEffects Adapter for ioBroker

This Adapter for ioBroker provides Light Effects.

Currently the following effects are implemented:

-   Notifications
    -   Alarm, Warning, Notification
    -   Light will blink in a configured color in a configured pulse
-   Color
    -   Switch betwwen configured colors
-   Candle
    -   Candle imitation from yellow to red with random color, brightness and time

### Configuration

On the first configuration page the lights are entered. Each light has the following elements:

-   Name of the light
-   Enabled
-   State - Real state for power on/off
-   Brightness - Real state for brightness
-   Color - Real state for color
-   Transition time - Real state for transition time
-   Color Temperature - Optional real state for color temperature
-   Effect - Default effect, can be overwritten on a state
-   Disable behaviour - Behaviour when effect is stopped (Reset to previous, Reset and power off, power off)

On the second page you can customize the effects.
For notification effects you can customize color, low brightness, high brightness and the amount of pulses.
For color effect you can customize the used colors, the transition time and the duration.

## Changelog

<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**

-   (gaudes) initial release

## License

MIT License

Copyright (c) 2024 Gaudes <ralf@gaudes.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
