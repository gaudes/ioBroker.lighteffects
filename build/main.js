"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
class Lighteffects extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "lighteffects"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    this.log.info("Adapter starting");
    this.log.debug("Current config: " + JSON.stringify(this.config));
    const oExistingObjects = await this.getAdapterObjectsAsync();
    this.log.silly("Existing objects: " + JSON.stringify(oExistingObjects));
    if (this.config.lights.length > 0) {
      for (const cLight of this.config.lights) {
        if (cLight.name === "" || cLight.name === null) {
          this.log.warn("Config contains light without name");
          return;
        }
        if (cLight.state === "" || cLight.state === null) {
          this.log.warn(`Config light ${cLight.name} has no object for state`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.state) === null) {
            this.log.warn(`Config light ${cLight.name} has not existing object for state`);
            return;
          }
        }
        if (cLight.brightness === "" || cLight.brightness === null) {
          this.log.warn(`Config light ${cLight.name} has no object for brightness`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.brightness) === null) {
            this.log.warn(`Config light ${cLight.name} has not existing object for brightness`);
            return;
          }
        }
        if (cLight.color === "" || cLight.color === null) {
          this.log.warn(`Config light ${cLight.name} has no object for color`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.color) === null) {
            this.log.warn(`Config light ${cLight.name} has not existing object for color`);
            return;
          }
        }
        if (cLight.transition === "" || cLight.transition === null) {
          this.log.warn(`Config light ${cLight.name} has no object for transition`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.transition) === null) {
            this.log.warn(`Config light ${cLight.name} has not existing object for transition`);
            return;
          }
        }
        if (cLight.enabled === true) {
          if (oExistingObjects[this.name + "." + this.instance + "." + cLight.name]) {
            delete oExistingObjects[this.name + "." + this.instance + "." + cLight.name];
          } else {
            await this.createDeviceAsync(cLight.name);
          }
          if (oExistingObjects[this.name + "." + this.instance + "." + cLight.name + ".effect"]) {
            delete oExistingObjects[this.name + "." + this.instance + "." + cLight.name + ".effect"];
          } else {
            await this.setObjectNotExistsAsync(cLight.name + ".effect", {
              type: "state",
              common: {
                name: "effect",
                type: "string",
                role: "state",
                states: { color: "color", candle: "candle" },
                read: true,
                write: true
              },
              native: {}
            });
            this.setStateAsync(cLight.name + ".effect", cLight.effect);
          }
          if (oExistingObjects[this.name + "." + this.instance + "." + cLight.name + ".state"]) {
            delete oExistingObjects[this.name + "." + this.instance + "." + cLight.name + ".state"];
          } else {
            await this.setObjectNotExistsAsync(cLight.name + ".state", {
              type: "state",
              common: {
                name: "state",
                type: "boolean",
                role: "state",
                read: true,
                write: true
              },
              native: {}
            });
          }
        }
        await this.setStateAsync(cLight.name + ".state", false);
        this.subscribeStates(cLight.name + ".state");
        this.subscribeStates(cLight.name + ".effect");
      }
      this.log.debug(`REST: ${JSON.stringify(oExistingObjects)}`);
    }
  }
  onUnload(callback) {
    try {
      callback();
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    if (state) {
      this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Lighteffects(options);
} else {
  (() => new Lighteffects())();
}
//# sourceMappingURL=main.js.map
