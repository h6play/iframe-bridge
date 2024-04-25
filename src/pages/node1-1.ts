import { IFrameBridge } from '../../lib/main';
async function script() {
    const bridge = new IFrameBridge({ name: 'Node1-1' });
    bridge.on('say', async () => 'from Node1-1');

    bridge.ready(async () => {
        console.log('Node1-1 ready');
    });

    bridge.ready('Main', async () => {
        console.log('Node1-1 ready Main');

        // Request Main (main window communication)
        bridge.request({
            name: 'Main',
            method: 'say',
        }).then((vo: any) => {
            console.log('--- Main say', vo);
        }).catch(err => {
            console.log('--- Main say error', err);
        });
    });

    bridge.ready('Node1', async () => {
        console.log('Node1-1 ready Node1');

        // Request Parent (parent window communication)
        bridge.request({
            name: 'Parent',
            method: 'say',
        }).then((vo: any) => {
            console.log('--- Parent say', vo);
        }).catch(err => {
            console.log('--- Parent say error', err);
        });
    });

    bridge.ready('Node1', async () => {
        console.log('Node1-1 ready Node1');

        // Request Node2-1 (cross-level communication)
        bridge.request({
            name: 'Node2-1',
            method: 'say',
        }).then((vo: any) => {
            console.log('--- Node2-1 say', vo);
        }).catch(err => {
            console.log('--- Node2-1 say error', err);
        });
    });
}

function template(): string {
    return `
    <div class="page">
        <h1>Node1-1</h1>
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