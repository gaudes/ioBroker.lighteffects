/*
 * Created with @iobroker/create-adapter v2.1.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { GlobalHelper } from "./modules/global-helper";

let Helper: GlobalHelper;

enum StopLightBy {
	"StopEffect",
	"PowerOff",
	"SwitchEffect",
}

interface Light {
	name: string;
	enabled: boolean;
	state: string;
	brightness: string;
	color: string;
	colortemp: string;
	transition: string;
	defaulteffect: string;
	disabling: string;
	verified: boolean;
	active: boolean;
	currenteffect: string;
	effectPrevious: string | null;
	currentstate: boolean | null;
	currentbrightness: number | null;
	currentcolor: string | null;
	currentcolortemp: number | null;
	currentsetting: string;
	currenttransition: number | null;
	stoplightby: StopLightBy | null;
}

let Lights: Light[];

const MsgErrUnknown = "Unknown Error";
const EffectTimeout: any = null;
// let EffectResetTimeout: any = null;

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
		// Init variables
		let oExistingObjects: Record<string, ioBroker.AdapterScopedObject> | null = null;
		try {
			// Adapter starting
			Helper.ReportingInfo("Info", "Adapter", "Adapter starting");
			Helper.ReportingInfo("Debug", "Adapter", "Current config: " + JSON.stringify(this.config));
			Lights = [];
			// Get existing states
			oExistingObjects = await this.getAdapterObjectsAsync();
			Helper.ReportingInfo("Debug", "Adapter", "Existing objects: " + JSON.stringify(oExistingObjects));
		} catch (err) {
			Helper.ReportingError(err as Error, MsgErrUnknown, "onReady/Start");
		}
		//#region Check config, create and cleanup states
		if (this.config.lights.length > 0) {
			for (const cLight of this.config.lights) {
				try {
					// Creating internal object from config
					Lights.push({
						name: cLight.name,
						enabled: cLight.enabled,
						state: cLight.state,
						brightness: cLight.brightness,
						color: cLight.color,
						colortemp: cLight.colortemp,
						transition: cLight.transition,
						defaulteffect: cLight.effect,
						disabling: cLight.disabling,
						verified: false,
						active: false,
						currenteffect: cLight.effect,
						effectPrevious: null,
						currentstate: null,
						currentbrightness: null,
						currentcolor: null,
						currentcolortemp: null,
						currentsetting: "color",
						currenttransition: null,
						stoplightby: null,
					});
				} catch (err) {
					Helper.ReportingError(err as Error, MsgErrUnknown, "onReady/LightCreate");
				}

				//#region Verify config element
				try {
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
						Helper.ReportingInfo(
							"Warn",
							"Adapter",
							`Config light ${cLight.name} has no object for brightness`,
						);
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
						Helper.ReportingInfo(
							"Warn",
							"Adapter",
							`Config light ${cLight.name} has no object for transition`,
						);
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
				} catch (err) {
					Helper.ReportingError(err as Error, MsgErrUnknown, "onReady/LightVerify");
				}
				//#endregion

				//#region Creating objects when enabled
				try {
					if (cLight.enabled === true) {
						// Checking or createing device
						if (oExistingObjects![this.name + "." + this.instance + "." + cLight.name]) {
							// Already exists
							delete oExistingObjects![this.name + "." + this.instance + "." + cLight.name];
						} else {
							// Create device
							await this.createDeviceAsync(cLight.name);
						}
						// Checking or createing effect
						if (oExistingObjects![this.name + "." + this.instance + "." + cLight.name + "." + "effect"]) {
							// Already exists
							delete oExistingObjects![
								this.name + "." + this.instance + "." + cLight.name + "." + "effect"
							];
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
						if (oExistingObjects![this.name + "." + this.instance + "." + cLight.name + "." + "state"]) {
							// Already exists
							delete oExistingObjects![
								this.name + "." + this.instance + "." + cLight.name + "." + "state"
							];
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
				} catch (err) {
					Helper.ReportingError(err as Error, MsgErrUnknown, "onReady/LightCreateObjects");
				}
				//#endregion

				//#region Cleanup state and subscribe object
				try {
					await this.setStateAsync(cLight.name + "." + "state", false);
					await this.setStateAsync(cLight.name + "." + "effect", cLight.effect);
					this.subscribeStates(cLight.name + "." + "state");
					this.subscribeStates(cLight.name + "." + "effect");
					// Subscribe foreign state for poweroff events
					this.subscribeForeignStates(cLight.state);
				} catch (err) {
					Helper.ReportingError(err as Error, MsgErrUnknown, "onReady/LightCleanupSubscribe");
				}
				//#endregion
			}

			Helper.ReportingInfo("Debug", "Adapter", `Internal Lights object: ${JSON.stringify(Lights)}`);

			//#region Cleaning up reminding objects
			try {
				Helper.ReportingInfo("Debug", "Adapter", `Objects to cleanup: ${JSON.stringify(oExistingObjects)}`);
				Object.entries(oExistingObjects!).map(([key, _value]) => {
					Helper.ReportingInfo("Debug", "Adapter", `Deleting unneeded object ${key}`);
					this.delForeignObjectAsync(key);
				});
			} catch (err) {
				Helper.ReportingError(err as Error, MsgErrUnknown, "onReady/Cleanup");
			}
			//#endregion
		}
		//#endregion
	}
	//#endregion

	//#region onUnload
	private onUnload(callback: () => void): void {
		try {
			for (const cLight of Lights) {
				if (cLight.active === true) {
					Lights[Lights.findIndex((obj) => obj.name == cLight.name)].active = false;
				}
			}
			this.setTimeout(() => {
				this.clearTimeout(EffectTimeout);
				//this.clearTimeout(EffectResetTimeout);
				callback();
			}, 1500);
		} catch (e) {
			callback();
		}
	}
	//#endregion

	//#region onStateChange
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		try {
			if (state) {
				Helper.ReportingInfo(
					"Debug",
					"onStateChange",
					`state ${id} changed: ${state.val} (ack = ${state.ack})`,
				);
				// Own states
				if (id.startsWith(this.name + "." + this.instance)) {
					// Get Name of Config Light
					const LightName = id.split(".")[2];
					// Get object name for light
					const ChangedProperty = id.split(".")[3];
					// Read internal light to variable
					const Light = Lights[Lights.findIndex((obj) => obj.name == LightName)];
					Helper.ReportingInfo("Debug", "onStateChange", `CurrentLight: ${JSON.stringify(Light)}`);
					// Effect changed
					if (
						ChangedProperty === "effect" &&
						state.val !== null &&
						state.val !== "undefined" &&
						typeof state.val === "string"
					) {
						if (Light.active === true) {
							// Save previous effect (Then don't save current-values and used after notify)
							Lights[Lights.findIndex((obj) => obj.name == LightName)].effectPrevious =
								Light.currenteffect;
							Lights[Lights.findIndex((obj) => obj.name == LightName)].currenteffect = state.val;
							this.effectRun(Light);
						} else {
							Lights[Lights.findIndex((obj) => obj.name == LightName)].currenteffect = state.val;
						}
					}
					if (ChangedProperty === "state") {
						// Enable effect
						if (state.val === true) {
							Lights[Lights.findIndex((obj) => obj.name == LightName)].stoplightby = null;
							this.effectRun(Light);
						} else {
							Lights[Lights.findIndex((obj) => obj.name == LightName)].stoplightby =
								StopLightBy.StopEffect;
							Lights[Lights.findIndex((obj) => obj.name == LightName)].effectPrevious = null;
						}
					}
				} else {
					// Foreign state, check if powered off and effect running
					if (state.val === false && Lights[Lights.findIndex((obj) => obj.state == id)].active === true) {
						Lights[Lights.findIndex((obj) => obj.state == id)].stoplightby = StopLightBy.PowerOff;
						Lights[Lights.findIndex((obj) => obj.state == id)].effectPrevious = null;
					}
				}
			} else {
				Helper.ReportingInfo("Debug", "Adapter", `state ${id} deleted`);
				// Deleted states by user ? Restart adapter ?
			}
		} catch (err) {
			Helper.ReportingError(err as Error, MsgErrUnknown, "onStateChange");
		}
	}
	//#endregion
	//#endregion

	//#region Effect Functions

	//#region Base Effect Function
	private async effectRun(Light: Light): Promise<void> {
		Helper.ReportingInfo("Debug", "effectRun", `Run effect for ${Light.name} with ${JSON.stringify(Light)}`);
		// Store current settings if no effect running
		if (Light.effectPrevious === null) {
			Helper.ReportingInfo("Debug", "effectRun", `Save current values for ${Light.name}`);
			await this.saveCurrentValues(Light);
		}
		// When effect already running
		if (Light.active === true && Light.effectPrevious !== null) {
			Helper.ReportingInfo("Debug", "effectRun", `Stop current effect for ${Light.name}`);
			// Stop current effect
			Light.stoplightby = StopLightBy.SwitchEffect;
			// Sleep 1000
			await new Promise((EffectTimeout) => setTimeout(EffectTimeout, 1100));
			Light.stoplightby = null;
		}
		// Set internal Light active
		Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = true;
		// Execute effect
		switch (Light.currenteffect) {
			case "color":
				this.effectColor(Light);
				break;
			case "candle":
				this.effectCandle(Light);
				break;
			default:
				this.effectNotify(
					Light,
					this.config.notification[
						this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)
					].color,
					this.config.notification[
						this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)
					].brightLow,
					this.config.notification[
						this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)
					].brightHigh,
					this.config.notification[
						this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)
					].pulse,
				);
		}
	}

	private async effectStop(Light: Light): Promise<void> {
		Helper.ReportingInfo("Debug", "effectStop", `Stop effect for ${Light.name} with ${JSON.stringify(Light)}`);
		Light.active = false;
		switch (Light.stoplightby) {
			// Stop by Poweroff: When Reset or PowerOffRestore Reset and Poweroff
			case StopLightBy.PowerOff:
				if (Light.disabling === "Reset" || Light.disabling === "PowerOffReset") {
					Helper.ReportingInfo("Debug", "effectStop", `Stopped by PowerOff  event for ${Light.name}`);
					await this.restoreCurrentValues(Light);
					await this.setForeignStateAsync(Light.state, false);
					await this.setStateAsync(Light.name + "." + "state", false);
					await this.setStateAsync(Light.name + "." + "effect", Light.defaulteffect);
				}
				break;
			// Stop by StopEffect
			case StopLightBy.StopEffect:
				switch (Light.disabling) {
					case "Reset": {
						await this.restoreCurrentValues(Light);
						await this.setStateAsync(Light.name + "." + "state", false);
						await this.setStateAsync(Light.name + "." + "effect", Light.defaulteffect);
						break;
					}
					case "PowerOffRestore": {
						await this.restoreCurrentValues(Light);
						await this.setForeignStateAsync(Light.state, false);
						await this.setStateAsync(Light.name + "." + "state", false);
						await this.setStateAsync(Light.name + "." + "effect", Light.defaulteffect);
						break;
					}
					default: {
						await this.setStateAsync(Light.name + "." + "state", false);
						await this.setStateAsync(Light.name + "." + "effect", Light.defaulteffect);
						await this.setForeignStateAsync(Light.state, false);
						break;
					}
				}
				break;
			// Do nothing, just stop
			default:
				break;
		}
		Lights[Lights.findIndex((obj) => obj.name === Light.name)].stoplightby = null;
		Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = false;
	}

	//#region Effect Notify
	// Simple effect: Set color, switch brightness from 1 to 100 three times, handle poweroff behaviour
	private async effectNotify(
		Light: Light,
		Color: string,
		BrightLow: number,
		BrightHigh: number,
		Pulse: number,
	): Promise<void> {
		try {
			Helper.ReportingInfo(
				"Debug",
				"effectNotify",
				`Effect notify for ${Light.name} with ${JSON.stringify(Light)}`,
			);
			// Set transition time to 0
			await this.setForeignStateAsync(Light.transition, 0);
			// Set color
			await this.setForeignStateAsync(Light.color, Color);
			// Power on
			await this.setForeignStateAsync(Light.state, true);
			for (let i = 0; i < Pulse; i++) {
				// Set brightness to 100%
				await this.setForeignStateAsync(Light.brightness, BrightHigh);
				// Sleep 1s
				await new Promise((f) => setTimeout(f, 1000));
				// Set brightness to 1%
				await this.setForeignStateAsync(Light.brightness, BrightLow);
				// Sleep 1s
				await new Promise((f) => setTimeout(f, 1000));
			}
			// No previous effect
			if (Light.effectPrevious === null) {
				Light.stoplightby = StopLightBy.StopEffect;
				this.effectStop(Light);
			} else {
				const effectPrevious = Light.effectPrevious;
				Light.effectPrevious = null;
				await this.setStateAsync(Light.name + "." + "effect", effectPrevious);
			}
		} catch (err) {
			Helper.ReportingError(err as Error, MsgErrUnknown, "effectNotify");
		}
	}
	//#endregion

	//#region Effect Color
	// Effect: Set color as defined in an infinit loop, handle poweroff behaviour
	private async effectColor(Light: Light): Promise<void> {
		try {
			Helper.ReportingInfo(
				"Debug",
				"effectColor",
				`Effect color for ${Light.name} with ${JSON.stringify(Light)}`,
			);
			// Set color to first color
			await this.setForeignStateAsync(Light.color, this.config.colorfulColors[0].color);
			// Power on
			await this.setForeignStateAsync(Light.state, true);
			// Set transition time to desired value
			await this.setForeignStateAsync(Light.transition, this.config.colorfulTransition);
			while (Light.stoplightby === null) {
				for (let i = 1; i < this.config.colorfulColors.length; i++) {
					for (let j = 1; j < this.config.colorfulDuration; j++) {
						if (Light.stoplightby === null) {
							await new Promise((EffectTimeout) => setTimeout(EffectTimeout, 1000));
						} else {
							break;
						}
					}
					if (Light.stoplightby === null) {
						await this.setForeignStateAsync(Light.color, this.config.colorfulColors[i].color);
					} else {
						break;
					}
				}
				if (Light.stoplightby === null) {
					await this.setForeignStateAsync(Light.color, this.config.colorfulColors[0].color);
				}
			}
			this.effectStop(Lights[Lights.findIndex((obj) => obj.name === Light.name)]);
		} catch (err) {
			Helper.ReportingError(err as Error, MsgErrUnknown, "effectColor");
		}
	}
	//#endregion

	//#region Effect Candle
	// Effect: Set candle colors as defined in an infinit loop, handle poweroff behaviour
	private async effectCandle(Light: Light): Promise<void> {
		function getRandomColor(): string {
			return "#" + ((1 << 24) + (255 << 16) + (Math.floor(Math.random() * 201) << 8) + 0).toString(16).slice(1);
		}
		try {
			Helper.ReportingInfo(
				"Debug",
				"effectCandle",
				`Effect candle for ${Light.name} with ${JSON.stringify(Light)}`,
			);
			// Set transition time to 1
			await this.setForeignStateAsync(Light.transition, 1);
			// Set color to initial color
			await this.setForeignStateAsync(Light.color, getRandomColor());
			// Power on
			await this.setForeignStateAsync(Light.state, true);
			while (Light.stoplightby === null) {
				await new Promise((EffectTimeout) => {
					return setTimeout(EffectTimeout, Math.floor(Math.random() * (1000 - 200 + 1) + 200) + 1000);
				});
				if (Light.stoplightby === null) {
					await this.setForeignStateAsync(Light.color, getRandomColor());
					let CurrBright = 100;
					if (typeof Light.currentbrightness === "number") {
						CurrBright = Light.currentbrightness;
					}
					await this.setForeignStateAsync(
						Light.brightness,
						Math.floor(Math.random() * (CurrBright - CurrBright / 2 + 1) + CurrBright / 2),
					);
				} else {
					break;
				}
			}
			this.effectStop(Lights[Lights.findIndex((obj) => obj.name === Light.name)]);
		} catch (err) {
			Helper.ReportingError(err as Error, MsgErrUnknown, "effectCandle");
		}
	}
	//#endregion

	//#region saveCurrentValues
	// Save current settings of light
	private async saveCurrentValues(Light: Light): Promise<void> {
		try {
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
			let CurrColorTime = 0;
			if (CurrColor!.val !== null && CurrColor!.val !== "undefined" && typeof CurrColor!.val === "string") {
				CurrColorTime = CurrColor?.ts || 0;
				Light.currentcolor = CurrColor!.val;
			} else {
				Light.currentcolor = "white";
			}
			// Save colortemp (if defined)
			if (Light.colortemp !== null && Light.colortemp !== "") {
				const CurrColorTemp = await this.getForeignStateAsync(Light.colortemp);
				if (
					CurrColorTemp!.val !== null &&
					CurrColorTemp!.val !== "undefined" &&
					typeof CurrColorTemp!.val === "number"
				) {
					Light.currentcolortemp = CurrColorTemp!.val;
					if (typeof CurrColorTemp?.ts === "number" && CurrColorTemp?.ts > CurrColorTime) {
						Light.currentsetting = "colortemp";
					}
				} else {
					Light.currentcolortemp = 350;
				}
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
		} catch (err) {
			Helper.ReportingError(err as Error, MsgErrUnknown, "saveCurrentValues");
		}
	}
	//#endregion

	//#region restoreCurrentValues
	// Save current settings of light
	private async restoreCurrentValues(Light: Light): Promise<void> {
		try {
			Helper.ReportingInfo(
				"Debug",
				"restoreCurrentValues",
				`Restore current values for ${Light.name} to brightness ${Light.currentbrightness}, color ${Light.currentcolor}, colortemp ${Light.currentcolortemp}, setting ${Light.currentsetting}, Transition ${Light.currenttransition}, State ${Light.currentstate}`,
			);
			await this.setForeignStateAsync(Light.brightness, Light.currentbrightness);
			await this.setForeignStateAsync(Light.state, Light.currentstate);
			if (Light.currentsetting === "color") {
				await this.setForeignStateAsync(Light.color, Light.currentcolor);
			} else {
				await this.setForeignStateAsync(Light.colortemp, Light.currentcolortemp);
			}
			await this.setForeignStateAsync(Light.transition, Light.currenttransition);
		} catch (err) {
			Helper.ReportingError(err as Error, MsgErrUnknown, "restoreCurrentValues");
		}
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
