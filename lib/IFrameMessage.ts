import { Track, ResultError, MoveDirection } from './Contract.d';

/** @class IFrameMessage */
export class IFrameMessage {
    public protocol: string; // <Protocol prefix> Used to distinguish the coexistence of multiple sets of protocols
    public path: string; // <Request path>
    public id: number; // <Message ID>
    public data: any; // <Request data>
    public method: string; // <Request method>
    public tracks: Track[]; // <Tracking points> Each forwarding layer will record the source direction.

    public result?: any; // <response result> Not undefined indicates a successful response
    public error?: ResultError; // <response error>

    constructor({
        protocol,
        path,
        id,
        data = null,
        method,
        result = undefined,
        error = undefined,
        tracks = [],
    }: {
        protocol: string;
        path: string;
        id: number;
        data?: any;
        method: string;
        result?: any;
        error?: ResultError;
        tracks?: Track[];
    }) {
        this.protocol = protocol;
        this.method = method;
        this.result = result;
        this.error = error;
        this.tracks = tracks;
        this.path = path;
        this.data = data;
        this.id = id;
    }

    /** @desc whether succeed */
    isSuccess() {
        return typeof this.error === 'undefined';
    }

    /** @desc Is it a request message? */
    isRequest() {
        return typeof (this.result) === 'undefined' && typeof (this.error) === 'undefined';
    }

    /** @desc Get response result */
    getResult() {
        return this.result || null;
    }

    /** @desc Set response result */
    setResult(result: any) {
        this.result = result === undefined ? null : result;
    }

    /** @desc Get response error */
    getError() {
        return this.error ? new Error(this.error.message) : null;
    }

    /** @desc Set response error */
    setError(err: any) {
        if (err && typeof err === 'object') {
            this.error = { message: err.stack || err.message || 'error' };
        } else {
            this.error = { message: 'error' };
        }
    }

    /** @desc Add track point */
    addTrack(name: string, direction: MoveDirection) {
        this.tracks.push({
            n: name,
            d: direction,
        });
    }

    /** @desc Whether to continue delivery */
    canTrack() {
        return this.tracks.length > 0;
    }

    /** @desc Pop track point */
    popTrack(): null|{
        name: string;
        direction: MoveDirection;
    } {
        const vo = this.tracks.pop();
        if (vo) {
            return { name: vo.n, direction: vo.d };
        }
        return null;
    }

    /** @desc Return the encoded result  */
    encode() {
        return IFrameMessage.Encode(this);
    }

    /** @desc counter */
    static countes: number = 0;

    /** @desc Encode the message */
    static Encode(vo: IFrameMessage): object {
        return {
            protocol: vo.protocol,
            method: vo.method,
            tracks: vo.tracks,
            result: vo.result,
            error: vo.error,
            path: vo.path,
            data: vo.data,
            id: vo.id,
        };
    }
    
    /** @desc Decode the message */
    static Decode(vo: any) {
        if (
            typeof vo === 'object' &&
            typeof vo.protocol === 'string' &&
            typeof vo.method === 'string' &&
            typeof vo.tracks === 'object' &&
            typeof vo.path === 'string' &&
            typeof vo.data !== 'undefined' &&
            typeof vo.id === 'number'
        ) {
            return new IFrameMessage({
                protocol: vo.protocol,
                method: vo.method,
                tracks: vo.tracks,
                path: vo.path,
                data: vo.data,
                id: vo.id,
                error: vo.error,
                result: vo.result,
            });
        }
        return null;
    }

    /** @desc Create message */
    static create({
        protocol,
        method,
        path,
        data = null,
        tracks = [],
    }: {
        protocol: string;
        method: string;
        path: string;
        data?: any;
        tracks?: Track[];
    }) {
        return new IFrameMessage({
            id: ++IFrameMessage.countes,
            protocol,
            method,
            path,
            data,
            tracks,
        });
    }
}