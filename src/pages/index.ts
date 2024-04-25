import { IFrameBridge } from '../../lib/main';
async function script() {
    const bridge = new IFrameBridge;
    bridge.iframe('Node1', document.getElementById('node1') as HTMLIFrameElement);
    bridge.iframe('Node2', document.getElementById('node2') as HTMLIFrameElement);

    bridge.on('say', async () => 'from Main');

    bridge.ready(async () => {
        console.log('Main ready');
    });

    bridge.ready('Node1', async () => {
        console.log('Main ready Node1');
    });

    bridge.ready('Node1-1', async () => {
        console.log('Main ready Node1-1');
    });
}

function template(): string {
    return `
    <div class="page">
        <h1>Main</h1>
        <iframe id="node1" src="/#/node1"></iframe>
        <iframe id="node2" src="/#/node2"></iframe>
    </div>
    `;
}

function style(): string {
    return `
    iframe {
        height: 368px;
    }
    iframe + iframe {
        margin-top: 10px;
    }
    `;
}

export default {
    template,
    script,
    style,
};