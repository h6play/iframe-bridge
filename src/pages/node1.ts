import { IFrameBridge } from '../../lib/main';
async function script() {
    const bridge = new IFrameBridge({ name: 'Node1' });
    bridge.iframe('Node1-1', document.getElementById('node1-1') as HTMLIFrameElement);

    bridge.on('say', async () => 'from Node1');

    // bridge.ready(async () => {
    //     console.log('Node1 ready');
    // });
}

function template(): string {
    return `
    <div class="page">
        <h1>Node1</h1>
        <iframe id="node1-1" src="/#/node1-1"></iframe>
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