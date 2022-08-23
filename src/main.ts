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
								states: { color: "color", candle: "candle", alarm: "alarm" },
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
			if (ChangedProperty === "effect") {
				Lights[Lights.findIndex((obj) => obj.name === LightName)].effect === state.val;
				if (Lights[Lights.findIndex((obj) => obj.name === LightName)].active === true) {
					// CHANGE EFFECT
				}
			}
			if (ChangedProperty === "state") {
				// Enable effect
				if (state.val === true) {
					switch (Lights[Lights.findIndex((obj) => obj.name === LightName)].effect) {
						case "alarm":
							this.effectAlarm(LightName);
							break;
					}
				} else {
					Lights[Lights.findIndex((obj) => obj.name === LightName)].active = false;
				}
			}
		} else {
			Helper.ReportingInfo("Debug", "Adapter", `state ${id} deleted`);
		}
	}
	//#endregion
	//#endregion

	//#region Effect Functions

	//#region Effect Alarm
	private effectAlarm(LightName: string): void {
		Helper.ReportingInfo("Info", "Adapter", `Effect alarm for ${LightName}`);
		Lights[Lights.findIndex((obj) => obj.name === LightName)].active = true;
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
