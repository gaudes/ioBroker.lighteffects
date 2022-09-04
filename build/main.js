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
var StopLightBy = /* @__PURE__ */ ((StopLightBy2) => {
  StopLightBy2[StopLightBy2["StopEffect"] = 0] = "StopEffect";
  StopLightBy2[StopLightBy2["PowerOff"] = 1] = "PowerOff";
  StopLightBy2[StopLightBy2["SwitchEffect"] = 2] = "SwitchEffect";
  return StopLightBy2;
})(StopLightBy || {});
let Lights;
const MsgErrUnknown = "Unknown Error";
const EffectTimeout = null;
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
    let oExistingObjects = null;
    try {
      Helper.ReportingInfo("Info", "Adapter", "Adapter starting");
      Helper.ReportingInfo("Debug", "Adapter", "Current config: " + JSON.stringify(this.config));
      Lights = [];
      oExistingObjects = await this.getAdapterObjectsAsync();
      Helper.ReportingInfo("Debug", "Adapter", "Existing objects: " + JSON.stringify(oExistingObjects));
    } catch (err) {
      Helper.ReportingError(err, MsgErrUnknown, "onReady/Start");
    }
    if (this.config.lights.length > 0) {
      for (const cLight of this.config.lights) {
        try {
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
            stoplightby: null
          });
        } catch (err) {
          Helper.ReportingError(err, MsgErrUnknown, "onReady/LightCreate");
        }
        try {
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
            Helper.ReportingInfo(
              "Warn",
              "Adapter",
              `Config light ${cLight.name} has no object for brightness`
            );
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
            Helper.ReportingInfo(
              "Warn",
              "Adapter",
              `Config light ${cLight.name} has no object for transition`
            );
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
        } catch (err) {
          Helper.ReportingError(err, MsgErrUnknown, "onReady/LightVerify");
        }
        try {
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
        } catch (err) {
          Helper.ReportingError(err, MsgErrUnknown, "onReady/LightCreateObjects");
        }
        try {
          await this.setStateAsync(cLight.name + ".state", false);
          await this.setStateAsync(cLight.name + ".effect", cLight.effect);
          this.subscribeStates(cLight.name + ".state");
          this.subscribeStates(cLight.name + ".effect");
          this.subscribeForeignStates(cLight.state);
        } catch (err) {
          Helper.ReportingError(err, MsgErrUnknown, "onReady/LightCleanupSubscribe");
        }
      }
      Helper.ReportingInfo("Debug", "Adapter", `Internal Lights object: ${JSON.stringify(Lights)}`);
      try {
        Helper.ReportingInfo("Debug", "Adapter", `Objects to cleanup: ${JSON.stringify(oExistingObjects)}`);
        Object.entries(oExistingObjects).map(([key, _value]) => {
          Helper.ReportingInfo("Debug", "Adapter", `Deleting unneeded object ${key}`);
          this.delForeignObjectAsync(key);
        });
      } catch (err) {
        Helper.ReportingError(err, MsgErrUnknown, "onReady/Cleanup");
      }
    }
  }
  onUnload(callback) {
    try {
      for (const cLight of Lights) {
        if (cLight.active === true) {
          Lights[Lights.findIndex((obj) => obj.name == cLight.name)].active = false;
        }
      }
      this.setTimeout(() => {
        this.clearTimeout(EffectTimeout);
        callback();
      }, 1500);
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    try {
      if (state) {
        Helper.ReportingInfo(
          "Debug",
          "onStateChange",
          `state ${id} changed: ${state.val} (ack = ${state.ack})`
        );
        if (id.startsWith(this.name + "." + this.instance)) {
          const LightName = id.split(".")[2];
          const ChangedProperty = id.split(".")[3];
          const Light = Lights[Lights.findIndex((obj) => obj.name == LightName)];
          Helper.ReportingInfo("Debug", "onStateChange", `CurrentLight: ${JSON.stringify(Light)}`);
          if (ChangedProperty === "effect" && state.val !== null && state.val !== "undefined" && typeof state.val === "string") {
            if (Light.active === true) {
              Lights[Lights.findIndex((obj) => obj.name == LightName)].effectPrevious = Light.currenteffect;
              Lights[Lights.findIndex((obj) => obj.name == LightName)].currenteffect = state.val;
              this.effectRun(Light);
            } else {
              Lights[Lights.findIndex((obj) => obj.name == LightName)].currenteffect = state.val;
            }
          }
          if (ChangedProperty === "state") {
            if (state.val === true) {
              Lights[Lights.findIndex((obj) => obj.name == LightName)].stoplightby = null;
              this.effectRun(Light);
            } else {
              Lights[Lights.findIndex((obj) => obj.name == LightName)].stoplightby = 0 /* StopEffect */;
              Lights[Lights.findIndex((obj) => obj.name == LightName)].effectPrevious = null;
            }
          }
        } else {
          if (state.val === false && Lights[Lights.findIndex((obj) => obj.state == id)].active === true) {
            Lights[Lights.findIndex((obj) => obj.state == id)].stoplightby = 1 /* PowerOff */;
            Lights[Lights.findIndex((obj) => obj.state == id)].effectPrevious = null;
          }
        }
      } else {
        Helper.ReportingInfo("Debug", "Adapter", `state ${id} deleted`);
      }
    } catch (err) {
      Helper.ReportingError(err, MsgErrUnknown, "onStateChange");
    }
  }
  async effectRun(Light) {
    Helper.ReportingInfo("Debug", "effectRun", `Run effect for ${Light.name} with ${JSON.stringify(Light)}`);
    if (Light.effectPrevious === null) {
      Helper.ReportingInfo("Debug", "effectRun", `Save current values for ${Light.name}`);
      await this.saveCurrentValues(Light);
    }
    if (Light.active === true && Light.effectPrevious !== null) {
      Helper.ReportingInfo("Debug", "effectRun", `Stop current effect for ${Light.name}`);
      Light.stoplightby = 2 /* SwitchEffect */;
      await new Promise((EffectTimeout2) => setTimeout(EffectTimeout2, 1e3));
      Light.stoplightby = null;
    }
    Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = true;
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
          this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)].color,
          this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)].brightLow,
          this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)].brightHigh,
          this.config.notification[this.config.notification.findIndex((obj) => obj.typeInternal == Light.currenteffect)].pulse
        );
    }
  }
  async effectStop(Light) {
    Helper.ReportingInfo("Debug", "effectStop", `Stop effect for ${Light.name} with ${JSON.stringify(Light)}`);
    Light.active = false;
    switch (Light.stoplightby) {
      case 1 /* PowerOff */:
        if (Light.disabling === "Reset" || Light.disabling === "PowerOffReset") {
          Helper.ReportingInfo("Debug", "effectStop", `Stopped by PowerOff  event for ${Light.name}`);
          await this.restoreCurrentValues(Light);
          await this.setForeignStateAsync(Light.state, false);
          await this.setStateAsync(Light.name + ".state", false);
          await this.setStateAsync(Light.name + ".effect", Light.defaulteffect);
        }
        break;
      case 0 /* StopEffect */:
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
        break;
      default:
        break;
    }
    Lights[Lights.findIndex((obj) => obj.name === Light.name)].stoplightby = null;
    Lights[Lights.findIndex((obj) => obj.name === Light.name)].active = false;
  }
  async effectNotify(Light, Color, BrightLow, BrightHigh, Pulse) {
    try {
      Helper.ReportingInfo(
        "Debug",
        "effectNotify",
        `Effect notify for ${Light.name} with ${JSON.stringify(Light)}`
      );
      await this.setForeignStateAsync(Light.transition, 0);
      await this.setForeignStateAsync(Light.color, Color);
      await this.setForeignStateAsync(Light.state, true);
      for (let i = 1; i < Pulse; i++) {
        await this.setForeignStateAsync(Light.brightness, BrightHigh);
        await new Promise((f) => setTimeout(f, 1e3));
        await this.setForeignStateAsync(Light.brightness, BrightLow);
        await new Promise((f) => setTimeout(f, 1e3));
      }
      if (Light.effectPrevious === null) {
        Light.stoplightby = 0 /* StopEffect */;
        this.effectStop(Light);
      } else {
        const effectPrevious = Light.effectPrevious;
        Light.effectPrevious = null;
        await this.setStateAsync(Light.name + ".effect", effectPrevious);
      }
    } catch (err) {
      Helper.ReportingError(err, MsgErrUnknown, "effectNotify");
    }
  }
  async effectColor(Light) {
    try {
      Helper.ReportingInfo(
        "Debug",
        "effectColor",
        `Effect color for ${Light.name} with ${JSON.stringify(Light)}`
      );
      await this.setForeignStateAsync(Light.color, this.config.colorfulColors[0].color);
      await this.setForeignStateAsync(Light.state, true);
      await this.setForeignStateAsync(Light.transition, this.config.colorfulTransition);
      while (Light.stoplightby === null) {
        for (let i = 1; i < this.config.colorfulColors.length; i++) {
          for (let j = 1; j < this.config.colorfulDuration; j++) {
            if (Light.stoplightby === null) {
              await new Promise((EffectTimeout2) => setTimeout(EffectTimeout2, 1e3));
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
      Helper.ReportingError(err, MsgErrUnknown, "effectColor");
    }
  }
  async effectCandle(Light) {
    function getRandomColor() {
      return "#" + ((1 << 24) + (255 << 16) + (Math.floor(Math.random() * 201) << 8) + 0).toString(16).slice(1);
    }
    try {
      Helper.ReportingInfo(
        "Debug",
        "effectCandle",
        `Effect candle for ${Light.name} with ${JSON.stringify(Light)}`
      );
      await this.setForeignStateAsync(Light.transition, 1);
      await this.setForeignStateAsync(Light.color, getRandomColor());
      await this.setForeignStateAsync(Light.state, true);
      while (Light.stoplightby === null) {
        await new Promise((EffectTimeout2) => {
          return setTimeout(EffectTimeout2, Math.floor(Math.random() * (1e3 - 200 + 1) + 200) + 1e3);
        });
        if (Light.stoplightby === null) {
          await this.setForeignStateAsync(Light.color, getRandomColor());
          let CurrBright = 100;
          if (typeof Light.currentbrightness === "number") {
            CurrBright = Light.currentbrightness;
          }
          await this.setForeignStateAsync(
            Light.brightness,
            Math.floor(Math.random() * (CurrBright - CurrBright / 2 + 1) + CurrBright / 2)
          );
        } else {
          break;
        }
      }
      this.effectStop(Lights[Lights.findIndex((obj) => obj.name === Light.name)]);
    } catch (err) {
      Helper.ReportingError(err, MsgErrUnknown, "effectCandle");
    }
  }
  async saveCurrentValues(Light) {
    try {
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
        if (CurrColorTemp.val !== null && CurrColorTemp.val !== "undefined" && typeof CurrColorTemp.val === "number") {
          Light.currentcolortemp = CurrColorTemp.val;
          if (typeof (CurrColorTemp == null ? void 0 : CurrColorTemp.ts) === "number" && (CurrColorTemp == null ? void 0 : CurrColorTemp.ts) > CurrColorTime) {
            Light.currentsetting = "colortemp";
          }
        } else {
          Light.currentcolortemp = 350;
        }
      }
      const CurrTransition = await this.getForeignStateAsync(Light.transition);
      if (CurrTransition.val !== null && CurrTransition.val !== "undefined" && typeof CurrTransition.val === "number" && CurrTransition.val >= 0) {
        Light.currenttransition = CurrTransition.val;
      } else {
        Light.currenttransition = 0;
      }
    } catch (err) {
      Helper.ReportingError(err, MsgErrUnknown, "saveCurrentValues");
    }
  }
  async restoreCurrentValues(Light) {
    try {
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
    } catch (err) {
      Helper.ReportingError(err, MsgErrUnknown, "restoreCurrentValues");
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Lighteffects(options);
} else {
  (() => new Lighteffects())();
}
//# sourceMappingURL=main.js.map
