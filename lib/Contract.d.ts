import { IFrameMessage } from "./IFrameMessage";

/** @type event callback */
export type IFrameCallback = (message: IFrameMessage) => Promise<any>;

/** @type ready callback */
export type IFrameReady = () => Promise<any>;

/** @enum message direction */
export enum MoveDirection {
    UP = 1, // Up
    DOWN = 2, // Down
    SELF = 3, // Self
}

/** @type tracking point */
export type Track = {
    n: string; // <PageName>
    d: number; // <MoveDirection> MoveDirection.*
};

/** @type error */
export type ResultError = {
    message: string;
};

/** @enum internal domain */
export const Main = 'Main';
export const Parent = 'Parent';