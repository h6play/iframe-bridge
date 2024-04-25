import { IFrameBridge } from '../../lib/main';
async function script() {
    const bridge = new IFrameBridge({ name: 'Node2-1' });
    bridge.on('say', async () => 'from Node2-1');
    // bridge.ready(async () => {
    //     console.log('Node2-1 ready');
    // });
}

function template(): string {
    return `
    <div class="page">
        <h1>Node2-1</h1>
    </div>
    `;
}

function style(): string {
    return ``;
}

export default {
    template,
    script,
    style,
};