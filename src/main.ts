/*
 * Created with @iobroker/create-adapter v2.1.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";

// Load your modules here, e.g.:
// import * as fs from "fs";

class Lighteffects extends utils.Adapter {
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "lighteffects",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Adapter starting
		this.log.info("Adapter starting");
		this.log.debug("Current config: " + JSON.stringify(this.config));

		//#region Check config, create and cleanup states
		// Get existing states
		const oExistingObjects = await this.getAdapterObjectsAsync();
		this.log.silly("Existing objects: " + JSON.stringify(oExistingObjects));
		if (this.config.lights.length > 0) {
			for (const cLight of this.config.lights) {
				//#region Verify config element
				if (cLight.name === "" || cLight.name === null) {
					this.log.warn("Config contains light without name");
					return;
				}
				if (cLight.state === "" || cLight.state === null) {
					this.log.warn(`Config light ${cLight.name} has no object for state`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.state)) === null) {
						this.log.warn(`Config light ${cLight.name} has not existing object for state`);
						return;
					}
				}
				if (cLight.brightness === "" || cLight.brightness === null) {
					this.log.warn(`Config light ${cLight.name} has no object for brightness`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.brightness)) === null) {
						this.log.warn(`Config light ${cLight.name} has not existing object for brightness`);
						return;
					}
				}
				if (cLight.color === "" || cLight.color === null) {
					this.log.warn(`Config light ${cLight.name} has no object for color`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.color)) === null) {
						this.log.warn(`Config light ${cLight.name} has not existing object for color`);
						return;
					}
				}
				if (cLight.transition === "" || cLight.transition === null) {
					this.log.warn(`Config light ${cLight.name} has no object for transition`);
					return;
				} else {
					if ((await this.getForeignObjectAsync(cLight.transition)) === null) {
						this.log.warn(`Config light ${cLight.name} has not existing object for transition`);
						return;
					}
				}
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
								states: { color: "color", candle: "candle" },
								read: true,
								write: true,
							},
							native: {},
						});
						this.setStateAsync(cLight.name + "." + "effect", cLight.effect);
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
				this.subscribeStates(cLight.name + "." + "state");
				this.subscribeStates(cLight.name + "." + "effect");
				//#endregion
			}

			//#region Cleaning up reminding objects
			this.log.debug(`REST: ${JSON.stringify(oExistingObjects)}`);
			//#endregion
		}
		//#endregion
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Lighteffects(options);
} else {
	// otherwise start the instance directly
	(() => new Lighteffects())();
}
