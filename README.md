# IFrameBridge

Make communication between nested iframes as easy as computer networking.

## Quickstart

Add it to an existing Vue or React Project:

```bash
# npm
npm install @bridge/iframe
# pnpm
pnpm install @bridge/iframe
# yarn
yarn add @bridge/iframe
```

## Network model

```bash
                         /——> (Children1)
(Parent) <———> (Node) <—————> (Children2)
                         \——> (ChildrenN) ...
```

- Each page is associated with a superior page and multiple direct subordinate pages.
- Pages and upper-level pages can directly communicate with each other to transfer data.
- Cross-level pages can communicate and transfer data through forwarding.

## System protocol

- built-in address:
    - `Main` Request the main window address
    - `Parent` Request the superior window (request the superior regardless of the level you are at)
- Main window methods:
    - `@bridge/online` Notify the main window registration address
    - `@bridge/domain` Get name mapping address
    - `@bridge/mapping` Get all mapped addresses
- All window methods:
    - `@bridge/ready` Is the node ready?

## Usage example

The following shows some commonly used methods

### Bridge page

- Main page `main.html`

```html
<h1>Main</h1>
<iframe src="node1.html" id="node1"></iframe>
```

```javascript
import { IFrameBridge } from '@bridge/iframe';

// Create bridge object
const bridge = new IFrameBridge;
birdge.ifrme('Node1', document.getElementById('node1') as HTMLIFrameElement);

// When the window is destroyed (needs to be called for a single page)
bridge.destroy();
```

- Node page `node1.html`

```html
<h1>Node1</h1>
```

```javascript
import { IFrameBridge } from '@bridge/iframe';

// Create bridge object
const bridge = new IFrameBridge({ name: 'Node1' });

// When the window is destroyed (needs to be called for a single page)
bridge.destroy();
```

### Subscribe/Publish

- Window initialization

```javascript
// The current window is initialized
bridge.ready(async () => {
    console.log('Main Ready');
});

// The specified window is initialized.
bridge.ready('Node1', async () => {
    console.log('Node1 Ready');
});
```

- Subscribe message

```javascript
// Subscribe events
bridge.on('say', async (vo: IFrameMessage) => {
    // vo.getData(); # Get Request data
    // vo.getResult(); # Get Response result
    return 'My name is Main';
});

// UnSubscribe events
bridge.off('say');
```

- Request&Response

```javascript
// Request a specific window
bridge.request({
    name: 'Node1', // Window name (Default is Main)
    method: 'say', // Method name
}).then((message: string) => {
    console.log('say.then', message);
}).catch((error: Error) => {
    console.log('say.catch', error);
});

// Request parent window (Immediate superior at any level)
bridge.request({
    name: 'Parent',
    method: 'say',
});

// Request main window
bridge.request({
    name: 'Main',
    method: 'say',
});
```

## Implementation principle

- Example `iframe` nesting level
    - `Main`
        - `Main/Node1`
            - `Main/Node1/Node1-1`
            - `Main/Node1/Node1-2`
        - `Main/Node2`
            - `Main/Node2/Node2-1`
            - `Main/Node2/Node2-2`

- Call the upper window interface `Main/Node1/Node1-1` to request `Main`
    - `<Assuming the full path has been obtained>`
    - `Main/Node1/Node1-1` Request **↑↑↑** To `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` Forward **↑↑↑** To `Main`
        **tracks[`{Node1-1:U}, {Node1:U}`]**
    - `Main` Processing logic
    - `Main` Response **↓↓↓** To `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` Forward **↓↓↓** To `Main/Node1/Node1-1`
        **tracks[]**
    - `Main/Node1/Node1-1` Response received

- Call `Main` on the downward window interface and request to `Main/Node1/Node1-1`
    - `<Assuming the full path has been obtained>`
    - `Main` Request **↓↓↓** To `Main/Node1`
        **tracks[`{Main:D}`]**
    - `Main/Node1` Forward **↓↓↓** To `Main/Node1/Node1-1`
        **tracks[`{Main:D}, {Node1:D}`]**
    - `Main/Node1/Node1-1` Processing logic
    - `Main/Node1/Node1-1` Response **↑↑↑** To `Main/Node1`
        **tracks[`{Main:D}`]**
    - `Main/Node1` Forward **↑↑↑** To `Main`
        **tracks[]**
    - `Main` Response received

- The peer window interface calls `Main/Node1/Node1-1` and requests to `Main/Node1/Node1-2`
    - `<Assuming the full path has been obtained>`
    - `Main/Node1/Node1-1` Request **↑↑↑** To `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` Forward **↓↓↓** To `Main/Node1/Node1-2`
        **tracks[`{Node1-1:U}, {Node1:D}`]]**
    - `Main/Node1/Node1-2` Processing logic
    - `Main/Node1/Node1-2` Response **↑↑↑** To `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` Forward **↓↓↓** To `Main/Node1/Node1-1`
        **tracks[]**
    - `Main/Node1/Node1-1` Response received

- Cross-level window interface calls `Main/Node1/Node1-1` to request `Main/Node2/Node2-1`
    - `<Assuming the full path has been obtained>`
    - `Main/Node1/Node1-1` Request **↑↑↑** To `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` Forward **↑↑↑** To `Main`
        **tracks[`{Node1-1:U}, {Node1:U}`]**
    - `Main` Forward **↓↓↓** To `Main/Node2`
        **tracks[`{Node1-1:U}, {Node1:U}, {Main:D}`]**
    - `Main/Node2` Forward **↓↓↓** To `Main/Node2/Node2-1`
        **tracks[`{Node1-1:U}, {Node1:U}, {Main:D}, {Node2:D}`]**
    - `Main/Node2/Node2-1` Processing logic
    - `Main/Node2/Node2-1` Response **↑↑↑** To `Main/Node2`
        **tracks[`{Node1-1:U}, {Node1:U}, {Main:D}`]**
    - `Main/Node2` Forward **↑↑↑** To `Main`
        **tracks[`{Node1-1:U}, {Node1:U}`]**
    - `Main` Forward **↓↓↓** To `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` Forward **↓↓↓** To `Main/Node1/Node1-1`
        **tracks[]**
    - `Main/Node1/Node1-1` Response received
