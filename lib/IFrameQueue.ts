import { IFrameMessage } from "./IFrameMessage";

/** @class IFrameQueue */
export class IFrameQueue {
    /** @desc Message record */
    records: {
        message: IFrameMessage; // message
        resolve: Function; // success callback
        reject: Function; // error callback
        timer: any; // timeout timer
    }[];

    constructor() {
        this.records = [];
    }

    /** @desc push message */
    push({
        message, resolve, reject, timer,
    }: {
        message: IFrameMessage;
        resolve: Function;
        reject: Function;
        timer: any;
    }) {
        this.records.push({
            message,
            resolve,
            reject,
            timer,
        });
    }
  
    /** @desc get message */
    pop(id: number) {
        const index = this.records.findIndex(v => v.message.id === id);
        if (index !== -1) {
            const v = this.records[index];
            this.records.splice(index, 1);
            return v;
        }
        return null;
    }

    /** @desc destroy */
    destroy() {
        while (this.records.length) {
            const vo = this.records.pop();
            if (vo) {
                clearTimeout(vo.timer);
                vo.reject(new Error('destroy'));
            }
        }
    }
}