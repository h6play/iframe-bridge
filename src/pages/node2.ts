import { IFrameBridge } from '../../lib/main';
async function script() {
    const bridge = new IFrameBridge({ name: 'Node2' });
    bridge.iframe('Node2-1', document.getElementById('node2-1') as HTMLIFrameElement);

    bridge.on('say', async () => 'from Node2');

    // bridge.ready(async () => {
    //     console.log('Node2 ready');
    // });
}

function template(): string {
    return `
    <div class="page">
        <h1>Node2</h1>
        <iframe id="node2-1" src="/#/node2-1"></iframe>
    </div>
    `;
}

function style(): string {
    return `
    iframe {
        height: 268px;
    }
    `;
}

export default {
    template,
    script,
    style,
};