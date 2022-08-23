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
var import_global_helper = require("./modules/global-helper");
let Helper;
let Lights;
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
    Helper = new import_global_helper.GlobalHelper(this);
    Helper.ReportingInfo("Info", "Adapter", "Adapter starting");
    Helper.ReportingInfo("Debug", "Adapter", "Current config: " + JSON.stringify(this.config));
    Lights = [];
    const oExistingObjects = await this.getAdapterObjectsAsync();
    Helper.ReportingInfo("Debug", "Adapter", "Existing objects: " + JSON.stringify(oExistingObjects));
    if (this.config.lights.length > 0) {
      for (const cLight of this.config.lights) {
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
          active: false
        });
        if (cLight.name === "" || cLight.name === null) {
          Helper.ReportingInfo("Warn", "Adapter", "Config contains light without name");
          return;
        }
        if (cLight.state === "" || cLight.state === null) {
          Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for state`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.state) === null) {
            Helper.ReportingInfo(
              "Warn",
              "Adapter",
              `Config light ${cLight.name} has not existing object for state`
            );
            return;
          }
        }
        if (cLight.brightness === "" || cLight.brightness === null) {
          Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for brightness`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.brightness) === null) {
            Helper.ReportingInfo(
              "Warn",
              "Adapter",
              `Config light ${cLight.name} has not existing object for brightness`
            );
            return;
          }
        }
        if (cLight.color === "" || cLight.color === null) {
          Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for color`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.color) === null) {
            Helper.ReportingInfo(
              "Warn",
              "Adapter",
              `Config light ${cLight.name} has not existing object for color`
            );
            return;
          }
        }
        if (cLight.transition === "" || cLight.transition === null) {
          Helper.ReportingInfo("Warn", "Adapter", `Config light ${cLight.name} has no object for transition`);
          return;
        } else {
          if (await this.getForeignObjectAsync(cLight.transition) === null) {
            Helper.ReportingInfo(
              "Warn",
              "Adapter",
              `Config light ${cLight.name} has not existing object for transition`
            );
            return;
          }
        }
        Lights[Lights.findIndex((obj) => obj.name === cLight.name)].verified = true;
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
                states: { color: "color", candle: "candle", alarm: "alarm" },
                read: true,
                write: true
              },
              native: {}
            });
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
        await this.setStateAsync(cLight.name + ".effect", cLight.effect);
        this.subscribeStates(cLight.name + ".state");
        this.subscribeStates(cLight.name + ".effect");
      }
      Helper.ReportingInfo("Debug", "Adapter", `Internal Lights object: ${JSON.stringify(Lights)}`);
      Helper.ReportingInfo("Debug", "Adapter", `Objects to cleanup: ${JSON.stringify(oExistingObjects)}`);
      Object.entries(oExistingObjects).map(([key, _value]) => {
        Helper.ReportingInfo("Debug", "Adapter", `Deleting unneeded object ${key}`);
        this.delForeignObjectAsync(key);
      });
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
      Helper.ReportingInfo("Debug", "Adapter", `state ${id} changed: ${state.val} (ack = ${state.ack})`);
      const LightName = id.split(".")[2];
      const ChangedProperty = id.split(".")[3];
      if (ChangedProperty === "effect") {
        Lights[Lights.findIndex((obj) => obj.name === LightName)].effect === state.val;
        if (Lights[Lights.findIndex((obj) => obj.name === LightName)].active === true) {
        }
      }
      if (ChangedProperty === "state") {
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
  effectAlarm(LightName) {
    Helper.ReportingInfo("Info", "Adapter", `Effect alarm for ${LightName}`);
    Lights[Lights.findIndex((obj) => obj.name === LightName)].active = true;
  }
}
if (require.main !== module) {
  module.exports = (options) => new Lighteffects(options);
} else {
  (() => new Lighteffects())();
}
//# sourceMappingURL=main.js.map
