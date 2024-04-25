/**
 * @class IFrameManager
 * @desc Used to manage all nodes
 */
export class IFrameManager {
    /** @desc list */
    nodes: {
        name: string; // 名称
        path?: string; // 路径
        iframe?: HTMLIFrameElement; // iframe
    }[] = [];

    /** @desc Push node */
    push({
        name, path = undefined, iframe = undefined
    }: {
        name: string;
        path?: string;
        iframe?: HTMLIFrameElement;
    }) {
        const index = this.nodes.findIndex(vo => vo.name === name);
        if (index > -1) {
            this.nodes[index] = { name, path, iframe };
        } else {
            this.nodes.push({ name, path, iframe });
        }
    }

    /** @desc Remove node */
    remove(name: string) {
        const index = this.nodes.findIndex(vo => vo.name === name);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    /** @desc Get node */
    get(name: string): null|{
        name: string;
        path?: string;
        iframe?: HTMLIFrameElement;
    } {
        return this.nodes.find(vo => vo.name === name) || null;
    }

    /** @desc Get all nodes */
    all() {
        return this.nodes;
    }
}