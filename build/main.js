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
    this.EffectTimeout = null;
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
          colortemp: cLight.colortemp,
          transition: cLight.transition,
          effect: cLight.effect,
          disabling: cLight.disabling,
          verified: false,
          active: false,
          currentstate: null,
          currentbrightness: null,
          currentcolor: null,
          currentcolortemp: null,
          currentsetting: "color",
          currenttransition: null
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
                states: {
                  color: "color",
                  candle: "candle",
                  notifyAlarm: "notifyAlarm",
                  notifyWarn: "notifyWarn",
                  notifyInfo: "notifyInfo"
                },
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
      const CurrLight = Lights[Lights.findIndex((obj) => obj.name == LightName)];
      Helper.ReportingInfo("Debug", "Adapter", `CurrentLight: ${JSON.stringify(CurrLight)}`);
      if (ChangedProperty === "effect" && state.val !== null && state.val !== "undefined" && typeof state.val === "string") {
        Lights[Lights.findIndex((obj) => obj.name == LightName)].effect = state.val;
        if (CurrLight.active === true) {
        }
      }
      if (ChangedProperty === "state") {
        if (state.val === true) {
          switch (CurrLight.effect) {
            case "color":
              this.effectColor(CurrLight);
              break;
            default:
              this.effectNotify(
                CurrLight,
                this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == CurrLight.effect)].color,
                this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == CurrLight.effect)].brightLow,
                this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == CurrLight.effect)].brightHigh,
                this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == CurrLight.effect)].pulse
              );
          }
        } else {
          Lights[Lights.findIndex((obj) => obj.name == LightName)].active = false;
          clearTimeout(this.EffectTimeout);
        }
      }
    } else {
      Helper.ReportingInfo("Debug", "Adapter", `state ${id} deleted`);
    }
  }
  async effectNotify(Light, Color, BrightLow, BrightHigh, Pulse) {
    Helper.ReportingInfo("Info", "effectNotify", `Effect notify for ${Light.name}`);
    Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = true;
    await this.saveCurrentValues(Light);
    await this.setForeignStateAsync(Light.transition, 0);
    await this.setForeignStateAsync(Light.color, Color);
    await this.setForeignStateAsync(Light.state, true);
    for (let i = 1; i < Pulse; i++) {
      await this.setForeignStateAsync(Light.brightness, BrightHigh);
      await new Promise((f) => setTimeout(f, 1e3));
      await this.setForeignStateAsync(Light.brightness, BrightLow);
      await new Promise((f) => setTimeout(f, 1e3));
    }
    switch (Light.disabling) {
      case "Reset": {
        await this.restoreCurrentValues(Light);
        break;
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
    Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = false;
    await this.setStateAsync(Light.name + ".state", false);
  }
  async effectColor(Light) {
    Helper.ReportingInfo("Info", "effectColor", `Effect color for ${Light.name}`);
    Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = true;
    await this.saveCurrentValues(Light);
    await this.setForeignStateAsync(Light.transition, this.config.colorfulTransition);
    await this.setForeignStateAsync(Light.color, this.config.colorfulColors[0].color);
    await this.setForeignStateAsync(Light.state, true);
    while (Light.active === true) {
      for (let i = 1; i < this.config.colorfulColors.length; i++) {
        await new Promise((EffectTimeout) => setTimeout(EffectTimeout, this.config.colorfulDuration * 1e3));
        if (Light.active === true) {
          await this.setForeignStateAsync(Light.color, this.config.colorfulColors[i].color);
        } else {
          break;
        }
      }
      if (Light.active === true) {
        await this.setForeignStateAsync(Light.color, this.config.colorfulColors[0].color);
      }
    }
    switch (Light.disabling) {
      case "Reset": {
        await this.restoreCurrentValues(Light);
        break;
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
    Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = false;
  }
  async saveCurrentValues(Light) {
    Helper.ReportingInfo("Debug", "saveCurrentValues", `Save current values for ${Light.name}`);
    const CurrState = await this.getForeignStateAsync(Light.state);
    if (CurrState.val === true) {
      Light.currentstate = true;
    } else {
      Light.currentstate = false;
    }
    const CurrBrightness = await this.getForeignStateAsync(Light.brightness);
    if (CurrBrightness.val !== null && CurrBrightness.val !== "undefined" && typeof CurrBrightness.val === "number" && CurrBrightness.val >= 0) {
      Light.currentbrightness = CurrBrightness.val;
    } else {
      Light.currentbrightness = 100;
    }
    const CurrColor = await this.getForeignStateAsync(Light.color);
    let CurrColorTime = 0;
    if (CurrColor.val !== null && CurrColor.val !== "undefined" && typeof CurrColor.val === "string") {
      CurrColorTime = (CurrColor == null ? void 0 : CurrColor.ts) || 0;
      Light.currentcolor = CurrColor.val;
    } else {
      Light.currentcolor = "white";
    }
    if (Light.colortemp !== null && Light.colortemp !== "") {
      const CurrColorTemp = await this.getForeignStateAsync(Light.colortemp);
      if (CurrColorTemp.val !== null && CurrColorTemp.val !== "undefined" && typeof CurrColorTemp.val === "string") {
        Light.currentcolortemp = CurrColorTemp.val;
        if (typeof (CurrColorTemp == null ? void 0 : CurrColorTemp.ts) === "number" && (CurrColorTemp == null ? void 0 : CurrColorTemp.ts) > CurrColorTime) {
          Light.currentsetting = "colortemp";
        }
      } else {
        Light.currentcolortemp = "white";
      }
    }
    const CurrTransition = await this.getForeignStateAsync(Light.transition);
    if (CurrTransition.val !== null && CurrTransition.val !== "undefined" && typeof CurrTransition.val === "number" && CurrTransition.val >= 0) {
      Light.currenttransition = CurrTransition.val;
    } else {
      Light.currenttransition = 0;
    }
  }
  async restoreCurrentValues(Light) {
    Helper.ReportingInfo(
      "Debug",
      "restoreCurrentValues",
      `Restore current values for ${Light.name} to brightness ${Light.currentbrightness}, color ${Light.currentcolor}, colortemp ${Light.currentcolortemp}, setting ${Light.currentsetting}, Transition ${Light.currenttransition}, State ${Light.currentstate}`
    );
    await this.setForeignStateAsync(Light.brightness, Light.currentbrightness);
    await this.setForeignStateAsync(Light.state, Light.currentstate);
    if (Light.currentsetting === "color") {
      await this.setForeignStateAsync(Light.color, Light.currentcolor);
    } else {
      await this.setForeignStateAsync(Light.colortemp, Light.currentcolortemp);
    }
    await this.setForeignStateAsync(Light.transition, Light.currenttransition);
  }
}
if (require.main !== module) {
  module.exports = (options) => new Lighteffects(options);
} else {
  (() => new Lighteffects())();
}
//# sourceMappingURL=main.js.map
