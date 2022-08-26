// This file extends the AdapterConfig type from "@types/iobroker"

/*
import { native } from "../io-package.json";

type _AdapterConfig = typeof native;
*/
// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		//interface AdapterConfig extends _AdapterConfig {}
		interface AdapterConfig {
			lights: [
				{
					name: string;
					enabled: boolean;
					state: string;
					brightness: string;
					color: string;
					colortemp: string;
					transition: string;
					effect: string;
					disabling: string;
				},
			];
			sentry_disable: boolean;
			notification: [
				{
					type: string;
					typeInternal: "string";
					color: string;
					brightLow: number;
					brightHigh: number;
					pulse: number;
				},
			];
			colorfulColors: [
				{
					color: string;
				},
			];
			colorfulTransition: number;
			colorfulDuration: number;
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
