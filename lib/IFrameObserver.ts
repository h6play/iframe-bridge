import { IFrameCallback } from "./Contract.d";
import { IFrameMessage } from "./IFrameMessage";

/**
 * @class IFrameObserver
 * @desc Subscribe/Publish
 */
export class IFrameObserver {
    private events: { [key: string]: IFrameCallback };

    constructor() {
        this.events = {};
    }

    /** @desc publish event */
    async emit(name: string, message: IFrameMessage) {
        if (this.events[name]) {
            const result = this.events[name](message);
            if (result instanceof Promise) {
                return await result;
            }
            return result;
        }
    }

    /** @desc Listen for events */
    on(name: string, callback: IFrameCallback) {
        this.events[name] = callback;
    }

    /** @desc Remove listening event */
    off(name: string) {
        delete this.events[name];
    }
}