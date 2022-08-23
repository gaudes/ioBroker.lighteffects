"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var global_helper_exports = {};
__export(global_helper_exports, {
  GlobalHelper: () => GlobalHelper
});
module.exports = __toCommonJS(global_helper_exports);
class GlobalHelper {
  constructor(adapterInstance) {
    this.Adapter = adapterInstance;
    if (this.Adapter.supportsFeature && this.Adapter.supportsFeature("PLUGINS")) {
      const sentryInstance = this.Adapter.getPluginInstance("sentry");
      if (sentryInstance) {
        this.Sentry = sentryInstance.getSentryObject();
      }
    }
  }
  async ReportingError(Err, FriendlyError, NameFunction, NameAction = "", Info = "", ReportSentry = true) {
    try {
      let sErrMsg = `Error occured: ${FriendlyError} in ${NameFunction}`;
      if (NameAction !== "")
        sErrMsg = sErrMsg + `(${NameAction})`;
      if (Err !== null)
        sErrMsg = sErrMsg + ` [${Err}] [${Info}]`;
      this.Adapter.log.error(sErrMsg);
    } catch (e) {
      this.Adapter.log.error(`Exception in ErrorReporting [${e}]`);
    }
    try {
      if (this.Sentry && this.Adapter.config.sentry_disable === false && ReportSentry === true) {
        this.Sentry && this.Sentry.withScope((scope) => {
          scope.setLevel("error");
          scope.setExtra("NameFunction", NameFunction);
          scope.setExtra("NameAction", NameAction);
          if (Info) {
            scope.setExtra("Info", Info);
          }
          if (this.Sentry) {
            this.Sentry.captureException(Err);
          }
        });
      }
    } catch (e) {
      this.Adapter.log.error(`Exception in ErrorReporting Sentry [${e}]`);
    }
  }
  ReportingInfo(Level, Category, Message, Data) {
    var _a;
    let iobMessage = Message;
    if (this.Adapter.log.level === "debug" || this.Adapter.log.level === "silly") {
      iobMessage = `[${Category}] ${Message}`;
    }
    switch (Level) {
      case "Warn":
        this.Adapter.log.warn(iobMessage);
        break;
      case "Debug":
        this.Adapter.log.debug(iobMessage);
        break;
      default:
        this.Adapter.log.info(iobMessage);
        break;
    }
    (_a = this.Sentry) == null ? void 0 : _a.addBreadcrumb({
      category: Category,
      message: Message,
      level: Level,
      data: Data
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GlobalHelper
});
//# sourceMappingURL=global-helper.js.map
