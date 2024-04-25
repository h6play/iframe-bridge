import { IFrameCallback, IFrameReady, MoveDirection, Parent, Main } from "./Contract.d";
import { IFrameObserver } from "./IFrameObserver";
import { IFrameManager } from "./IFrameManager";
import { IFrameMessage } from "./IFrameMessage";
import { IFrameQueue } from "./IFrameQueue";

/**
 * @class IFrameBridge
 * @desc Build a two-way communication bridge between the upper and lower levels of iframe
 */
export class IFrameBridge {
    name: string; // Window name, 'Parent' or 'Main' or '<Custom>'
    path: string; // Current path /<name>/<name> ...
    timeout: number; // Timeout time
    protocol: string; // Protocol prefix

    /** @desc Ready callback */
    readyState: boolean;
    readyCallbacks: IFrameReady[];

    /** @desc Message Queue */
    queue: IFrameQueue;

    /** @desc Domain name mapping table [{name,path}, ...] */
    mapping: IFrameManager;

    /** @desc Direct reports [{name,iframe}, ...] */
    children: IFrameManager;

    /** @desc Subscribe to publish */
    observer: IFrameObserver;

    constructor({
        name = '',
        timeout = 60 * 1000,
        protocol = 'bridge',
    }: {
        name?: string;
        timeout?: number;
        protocol?: string;
    } = {}) {
        if (IFrameBridge.node()) {
            this.name = name;
            this.path = '';
        } else {
            this.name = Main;
            this.path = Main;
        }
        this.timeout = timeout;
        this.protocol = protocol;
        this.readyState = false;
        this.readyCallbacks = [];
        this.queue = new IFrameQueue;
        this.mapping = new IFrameManager;
        this.children = new IFrameManager;
        this.observer = new IFrameObserver;
        this.mapping.push({ name: Main, path: Main });
        this.mapping.push({ name: Parent, path: Parent });
        this.onReceive = this.onReceive.bind(this);
        this.onCreated();
    }

    /** @desc Is it a subpage? */
    static node() {
        return window.parent !== window;
    }

    /** @desc Are you ready */
    async ready(name: string|IFrameReady, callback: null|IFrameReady = null) {
        if (typeof name === 'function') {
            callback = name;
        } else {
            const newCallback = callback || (() => {});
            callback = async () => {
                const listener = () => {
                    this.request({
                        name,
                        timeout: 300,
                        method: '@bridge/ready',
                    }).then(newCallback).catch(() => {
                        setTimeout(() => listener(), 300);
                    });
                };
                listener();
            };
        }

        if (this.readyState) {
            await callback();
        } else {
            this.readyCallbacks.push(callback);
        }
    }

    /** @desc Add iframe */
    iframe(name: string, iframe: HTMLIFrameElement) {
        this.children.push({ name, iframe });
    }

    /** @desc Off listener */
    off(name: string) {
        this.observer.off(name);
    }

    /** @desc Add listener */
    on(name: string, callback: IFrameCallback) {
        this.observer.on(name, callback);
    }

    /** @desc Request node method */
    request({
        data = null,
        name = Main,
        timeout = this.timeout,
        method,
    }: {
        timeout?: number;
        method: string;
        name?: string;
        data?: any;
    }): Promise<any> {
        return new Promise((resolve, reject) => {
            // console.log('Request', this.name, 'to', name, method);
            // Search path
            this.getMapping(name).then(({ path }) => {
                // Get direction
                const [direction, node] = this.getDirection(path);
 
                // Run option
                if (direction === MoveDirection.SELF) {
                    // Run self
                    this.observer.emit(method, data).then(resolve).catch(reject);
                } else {
                    // Creaet message
                    const message = IFrameMessage.create({
                        path,
                        data,
                        method,
                        protocol: this.protocol,
                    });

                    // Add queue
                    this.queue.push({
                        message,
                        resolve,
                        reject,
                        timer: setTimeout(() => {
                            if (this.queue.pop(message.id)) {
                                reject(new Error('timeout'));
                            }
                        }, timeout),
                    });

                    // Forward request message
                    this.forwardRequest({
                        node,
                        message,
                        direction,
                    });
                }
            }).catch(reject);
        });
    }

    /** @desc Destroy */
    destroy() {
        this.onDestroy();
    }

    /** @desc Received the news */
    private onReceive(event: MessageEvent) {
        // Get message
        const message = IFrameMessage.Decode(event.data);
        if (!message) { return; }

        // console.log('onReceive', message.method, message.isRequest() ? '→' : '←', message.path, this.name);

        // If it is a request message
        if (message.isRequest()) {
            // Get direction
            const [direction, node] = this.getDirection(message.path);

            // Run
            if (direction === MoveDirection.SELF || message.path === Parent) {
                // Run Self Or Parent
                this.observer.emit(message.method, message)
                    .then((vo: any) => message.setResult(vo))
                    .catch((vo: any) => message.setError(vo))
                    .finally(() => this.forwardResponse(message));
            } else {
                // Forward request message
                this.forwardRequest({
                    node,
                    message,
                    direction,
                });
            }
        } else {
            // Forward response message
            this.forwardResponse(message);
        }
    }

    /** @desc Destroy */
    private onDestroy() {
        // Remove event
        window.removeEventListener('message', this.onReceive);

        // Remove queue
        this.queue.destroy();
    }

    /** @desc Created */
    private onCreated() {
        // Add event
        window.removeEventListener('message', this.onReceive);
        window.addEventListener('message', this.onReceive);

        // Add '@bridge/ready' listener
        this.on('@bridge/ready', async () => null);
        
        if (IFrameBridge.node()) {
            // Registered address
            this.register();
        } else {
            // Ready successful
            this.readyOk();;
            // Add '@bridge/online' listener
            this.on('@bridge/online', async (vo: IFrameMessage) => {
                const name = vo.tracks[0].n;
                const path = Main + '/' + vo.tracks
                    .slice()
                    .reverse()
                    .map(v => v.n)
                    .join('/');
                this.mapping.push({ name, path });
                return { path };
            });
            // Add '@bridge/domain' listener
            this.on('@bridge/domain', async (vo: IFrameMessage) => {
                const { name } = vo.data || {};
                const node = this.mapping.get(name);
                if (!node) {
                    throw new Error('not found');
                }
                return { name: node.name, path: node.path };
            });
            // Add '@bridge/mapping' listener
            this.on('@bridge/mapping', async () => {
                return this.mapping.all();
            });
        }
    }

    /** @desc Forward request */
    private forwardRequest({
        node, message, direction
    }: {
        node: string;
        message: IFrameMessage,
        direction: MoveDirection,
    }) {
        // Add track
        message.addTrack(this.name, direction);

        // Forward request
        if (direction === MoveDirection.UP) {
            this.upSend(message).catch((err: any) => {
                message.popTrack();
                message.setError(err);
                this.forwardResponse(message);
            });
        } else {
            this.downSend(node, message).catch((err: any) => {
                message.popTrack();
                message.setError(err);
                this.forwardResponse(message);
            });
        }
    }

    /** @desc Forward response */
    private forwardResponse(message: IFrameMessage) {
        // Pop track
        const track = message.popTrack();
        if (track) {
            // Forward response
            if (track.direction === MoveDirection.UP) {
                this.downSend(track.name, message);
            } else {
                this.upSend(message);
            }
        } else {
            // Pop queue
            const vo = this.queue.pop(message.id);
            if (vo) {
                // Remove timerout
                clearTimeout(vo.timer);
                // Handle response
                if (message.isSuccess()) {
                    vo.resolve(message.getResult());
                } else {
                    vo.reject(message.getError());
                }
            }
        }
    }

    /** @desc pass up */
    private upSend(message: IFrameMessage): Promise<void> {
        return new Promise((resolve, reject) => {
            if (window.parent !== window) {
                window.parent.postMessage(message.encode(), '*');
                resolve();
            } else {
                reject(new Error('not found'));
            }
        });
    }

    /** @desc pass down */
    private downSend(name: string, message: IFrameMessage): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = this.children.get(name);
            if (child && child.iframe && child.iframe.contentWindow) {
                child.iframe.contentWindow.postMessage(message.encode(), '*');
                resolve();
            } else {
                reject(new Error('not found'));
            }
        });
    }

    /** @desc Register */
    private register() {
        this.request({
            name: Main,
            method: '@bridge/online',
        }).then(({ path }) => {
            this.path = path;
            this.mapping.push({ name: this.name, path });
            this.readyOk();
        }).catch((err: any) => {
            console.error(err);
            setTimeout(() => this.register(), 800);
        });
    }

    /** @desc Ready successful */
    private readyOk() {
        this.readyState = true;
        this.readyCallbacks.forEach(callback => callback());
    }

    /** @desc Get send direction */
    private getDirection(path: string): [MoveDirection, string] {
        // If it is not currently registered, keep going up.
        if (!this.path) {
            return [MoveDirection.UP, ''];
        }
        // If the current path is 'main/lv1' and the message is 'main/lv1', the current monitoring is executed.
        if (this.path === path) {
            return [MoveDirection.SELF, ''];
        }
        // If the current path is 'main/lv1' and the message is 'main/lv1/lv2', then find the child node 'lv2' and pass it down.
        else if (path.startsWith(this.path)) {
            const str = path.replace(this.path, '');
            return [MoveDirection.DOWN, str.split('/')[1]];
        }
        // If the current path is 'main/lv1', the message is 'main' and is passed upward
        // If the current path is 'main/lv1', the message is 'main/ov1/ov2' and is passed upward
        return [MoveDirection.UP, ''];
    }

    /** @desc Get domain mapping */
    private async getMapping(name: string): Promise<{
        name: string;
        path: string;
    }> {
        const mapping = this.mapping.get(name);
        if (mapping) {
            return { name, path: mapping.path as string };
        }
        const result = await this.request({
            name: Main,
            data: { name },
            method: '@bridge/domain',
        });
        if (!result) {
            throw new Error('not found');
        }
        this.mapping.push({ name, path: result.path });
        return { name, path: result.path };
    }
}