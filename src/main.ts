/*
 * Created with @iobroker/create-adapter v2.1.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { GlobalHelper } from "./modules/global-helper";

let Helper: GlobalHelper;

interface Light {
	name: string;
	enabled: boolean;
	state: string;
	brightness: string;
	color: string;
	transition: string;
	effect: string;
	disabling: string;
	verified: boolean;
	active: boolean;
	currentstate: boolean | null;
	currentbrightness: number | null;
	currentcolor: string | null;
	currenttransition: number | null;
}

let Lights: Light[];

class Lighteffects extends utils.Adapter {
	//#region Constructor
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "lighteffects",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}
	//#endregion

	//#region Base Functions of Adapter
	//#region onReady
	private async onReady(): Promise<void> {
		// Init Helper
		Helper = new GlobalHelper(this);
		// Adapter starting
		Helper.ReportingInfo("Info", "Adapter", "Adapter starting");
		Helper.ReportingInfo("Debug", "Adapter", "Current config: " + JSON.stringify(this.config));
		Lights = [];
		//#region Check config, create and cleanup states
		// Get existing states
		const oExistingObjects = await this.getAdapterObjectsAsync();
		Helper.ReportingInfo("Debug", "Adapter", "Existing objects: " + JSON.stringify(oExistingObjects));
		if (this.config.lights.length > 0) {
			for (const cLight of this.config.lights) {
				// Creating internal object from config
				Lights.push({
					name: cLight.name,
					enabled: cLight.enabled,
					state: cLight.state,
					brightness: cLight.brightness,
					color: cLight.color,
					transition: cLight.transition,
					effect: cLight.effect,
					disabling: cLight.disabling,
					verified: false,
					active: false,
					currentstate: null,
					currentbrightness: null,
					currentcolor: null,
					currenttransition: null,
				});

				//#region Verify config element
				if (cLight.name === "" || cLight.name === null) {
					Helper.ReportingInfo("Warn", "Adapter", "Config contains light without name");
					return;
				}
				if (cLight.state === "" || cLight.state === null) {
					Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for state`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.state)) === null) {
						Helper.ReportingInfo(
							"Warn",
							"Adapter",
							`Config light ${cLight.name} has not existing object for state`,
						);
						return;
					}
				}
				if (cLight.brightness === "" || cLight.brightness === null) {
					Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for brightness`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.brightness)) === null) {
						Helper.ReportingInfo(
							"Warn",
							"Adapter",
							`Config light ${cLight.name} has not existing object for brightness`,
						);
						return;
					}
				}
				if (cLight.color === "" || cLight.color === null) {
					Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for color`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.color)) === null) {
						Helper.ReportingInfo(
							"Warn",
							"Adapter",
							`Config light ${cLight.name} has not existing object for color`,
						);
						return;
					}
				}
				if (cLight.transition === "" || cLight.transition === null) {
					Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for transition`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.transition)) === null) {
						Helper.ReportingInfo(
							"Warn",
							"Adapter",
							`Config light ${cLight.name} has not existing object for transition`,
						);
						return;
					}
				}
				// Setting verified of internal object
				Lights[Lights.findIndex((obj) => obj.name === cLight.name)].verified = true;
				//#endregion

				//#region Creating objects when enabled
				if (cLight.enabled === true) {
					// Checking or createing device
					if (oExistingObjects[this.name + "." + this.instance + "." + cLight.name]) {
						// Already exists
						delete oExistingObjects[this.name + "." + this.instance + "." + cLight.name];
					} else {
						// Create device
						await this.createDeviceAsync(cLight.name);
					}
					// Checking or createing effect
					if (oExistingObjects[this.name + "." + this.instance + "." + cLight.name + "." + "effect"]) {
						// Already exists
						delete oExistingObjects[this.name + "." + this.instance + "." + cLight.name + "." + "effect"];
					} else {
						// Create State
						await this.setObjectNotExistsAsync(cLight.name + "." + "effect", {
							type: "state",
							common: {
								name: "effect",
								type: "string",
								role: "state",
								states: {
									color: "color",
									candle: "candle",
									notifyAlarm: "notifyAlarm",
									notifyWarn: "notifyWarn",
									notifyInfo: "notifyInfo",
								},
								read: true,
								write: true,
							},
							native: {},
						});
					}
					// Checking or createing state
					if (oExistingObjects[this.name + "." + this.instance + "." + cLight.name + "." + "state"]) {
						// Already exists
						delete oExistingObjects[this.name + "." + this.instance + "." + cLight.name + "." + "state"];
					} else {
						// Create State
						await this.setObjectNotExistsAsync(cLight.name + "." + "state", {
							type: "state",
							common: {
								name: "state",
								type: "boolean",
								role: "state",
								read: true,
								write: true,
							},
							native: {},
						});
					}
				}
				//#endregion

				//#region Cleanup state and subscribe object
				await this.setStateAsync(cLight.name + "." + "state", false);
				await this.setStateAsync(cLight.name + "." + "effect", cLight.effect);
				this.subscribeStates(cLight.name + "." + "state");
				this.subscribeStates(cLight.name + "." + "effect");
				//#endregion
			}

			Helper.ReportingInfo("Debug", "Adapter", `Internal Lights object: ${JSON.stringify(Lights)}`);

			//#region Cleaning up reminding objects
			Helper.ReportingInfo("Debug", "Adapter", `Objects to cleanup: ${JSON.stringify(oExistingObjects)}`);
			Object.entries(oExistingObjects).map(([key, _value]) => {
				Helper.ReportingInfo("Debug", "Adapter", `Deleting unneeded object ${key}`);
				this.delForeignObjectAsync(key);
			});
			//#endregion
		}
		//#endregion
	}
	//#endregion

	//#region onUnload
	private onUnload(callback: () => void): void {
		try {
			callback();
		} catch (e) {
			callback();
		}
	}
	//#endregion

	//#region onStateChange
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			Helper.ReportingInfo("Debug", "Adapter", `state ${id} changed: ${state.val} (ack = ${state.ack})`);
			// Get Name of Config Light
			const LightName = id.split(".")[2];
			// Get object name for light
			const ChangedProperty = id.split(".")[3];
			// Get internal light object
			const CurrLight = Lights[Lights.findIndex((obj) => obj.name === LightName)];
			if (ChangedProperty === "effect") {
				CurrLight.effect === state.val;
				if (CurrLight.active === true) {
					// CHANGE EFFECT
				}
			}
			if (ChangedProperty === "state") {
				// Enable effect
				if (state.val === true) {
					switch (CurrLight.effect) {
						case "notifyAlarm":
							this.effectNotify(CurrLight, "red");
							break;
						case "notifyInfo":
							this.effectNotify(CurrLight, "blue");
							break;
						case "notifyWarn":
							this.effectNotify(CurrLight, "orange");
							break;
					}
				} else {
					CurrLight.active = false;
				}
			}
		} else {
			Helper.ReportingInfo("Debug", "Adapter", `state ${id} deleted`);
			// Deleted states by user ? Restart adapter ?
		}
	}
	//#endregion
	//#endregion

	//#region Effect Functions

	//#region Effect Alarm
	// Simple effect: Set color, switch brightness from 1 to 100 three times, handle poweroff behaviour
	private async effectNotify(Light: Light, Color: string): Promise<void> {
		Helper.ReportingInfo("Info", "effectAlarm", `Effect alarm for ${Light.name}`);
		Light.active = true;
		await this.saveCurrentValues(Light);
		// Set transition time to 0
		await this.setForeignStateAsync(Light.transition, 0);
		// Set color to red
		await this.setForeignStateAsync(Light.color, Color);
		// Power on
		await this.setForeignStateAsync(Light.state, true);
		for (let i = 0; i < 4; i++) {
			// Set brightness to 100%
			await this.setForeignStateAsync(Light.brightness, 100);
			// Sleep 1s
			await new Promise((f) => setTimeout(f, 1000));
			// Set brightness to 1%
			await this.setForeignStateAsync(Light.brightness, 1);
			// Sleep 1s
			await new Promise((f) => setTimeout(f, 1000));
		}
		switch (Light.disabling) {
			case "Reset": {
				await this.restoreCurrentValues(Light);
			}
			case "PowerOffRestore": {
				await this.restoreCurrentValues(Light);
				await this.setForeignStateAsync(Light.state, false);
				break;
			}
			default: {
				await this.setForeignStateAsync(Light.state, false);
				break;
			}
		}
		Light.active = false;
		await this.setStateAsync(Light.name + "." + "state", false);
	}
	//#endregion

	//#region saveCurrentValues
	// Save current settings of light
	private async saveCurrentValues(Light: Light): Promise<void> {
		Helper.ReportingInfo("Debug", "saveCurrentValues", `Save current values for ${Light.name}`);
		// Save state
		const CurrState = await this.getForeignStateAsync(Light.state);
		if (CurrState!.val === true) {
			Light.currentstate = true;
		} else {
			Light.currentstate = false;
		}
		// Save brightness
		const CurrBrightness = await this.getForeignStateAsync(Light.brightness);
		if (
			CurrBrightness!.val !== null &&
			CurrBrightness!.val !== "undefined" &&
			typeof CurrBrightness!.val === "number" &&
			CurrBrightness!.val >= 0
		) {
			Light.currentbrightness = CurrBrightness!.val;
		} else {
			Light.currentbrightness = 100;
		}
		// Save color
		const CurrColor = await this.getForeignStateAsync(Light.color);
		if (CurrColor!.val !== null && CurrColor!.val !== "undefined" && typeof CurrColor!.val === "string") {
			Light.currentcolor = CurrColor!.val;
		} else {
			Light.currentcolor = "white";
		}
		// Save transition time
		const CurrTransition = await this.getForeignStateAsync(Light.transition);
		if (
			CurrTransition!.val !== null &&
			CurrTransition!.val !== "undefined" &&
			typeof CurrTransition!.val === "number" &&
			CurrTransition!.val >= 0
		) {
			Light.currenttransition = CurrTransition!.val;
		} else {
			Light.currenttransition = 0;
		}
	}
	//#endregion

	//#region restoreCurrentValues
	// Save current settings of light
	private async restoreCurrentValues(Light: Light): Promise<void> {
		Helper.ReportingInfo(
			"Debug",
			"restoreCurrentValues",
			`Restore current values for ${Light.name} to brightness ${Light.currentbrightness}, color ${Light.currentcolor}, Transition ${Light.currenttransition}, State ${Light.currentstate}`,
		);
		await this.setForeignStateAsync(Light.brightness, Light.currentbrightness);
		await this.setForeignStateAsync(Light.state, Light.currentstate);
		await this.setForeignStateAsync(Light.color, Light.currentcolor);
		await this.setForeignStateAsync(Light.transition, Light.currenttransition);
	}
	//#endregion

	//#endregion
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Lighteffects(options);
} else {
	// otherwise start the instance directly
	(() => new Lighteffects())();
}
