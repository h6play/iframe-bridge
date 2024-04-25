# IFrameBridge

使嵌套 iframe 之间的通信像计算机网络一样简单。

## 快速开始

将其添加到现有的 Vue 或 React 项目中：

```bash
# npm
npm install @bridge/iframe
# pnpm
pnpm install @bridge/iframe
# yarn
yarn add @bridge/iframe
```

## 网络模型

```bash
                         /——> (子节点1)
(父节点) <———> (节点) <——————> (子节点2)
                         \——> (子节点n) ...
```

- 每个页面都与一个上级页面和多个直接下级页面相关联。
- 页面和上层页面可以直接通信传输数据。
- 跨级页面可以通过转发的方式进行通信和传输数据。

## 系统协议

- 内置地址:
    - `Main` 请求主窗口地址
    - `Parent` 向上级请求窗口（无论级别高低都向上级请求）
- 主窗口提供的方法:
    - `@bridge/online` 通知主窗口注册地址
    - `@bridge/domain` 获取名称映射地址
    - `@bridge/mapping` 获取所有映射地址
- 所有窗口提供的方法:
    - `@bridge/ready` 节点准备好了吗？

## 使用示例

下面展示一些常用的方法

### 桥接页面

- 主页面 `main.html`

```html
<h1>Main</h1>
<iframe src="node1.html" id="node1"></iframe>
```

```javascript
import { IFrameBridge } from '@bridge/iframe';

// 创建桥接对象
const bridge = new IFrameBridge;
birdge.ifrme('Node1', document.getElementById('node1') as HTMLIFrameElement);

// 窗口销毁时（单页需要调用）
bridge.destroy();
```

- 子页面 `node1.html`

```html
<h1>Node1</h1>
```

```javascript
import { IFrameBridge } from '@bridge/iframe';

// 创建桥接对象
const bridge = new IFrameBridge({ name: 'Node1' });

// 窗口销毁时（单页需要调用）
bridge.destroy();
```

### 订阅/发布

- 窗口初始化

```javascript
// 当前窗口初始化
bridge.ready(async () => {
    console.log('Main Ready');
});

// 指定窗口初始化
bridge.ready('Node1', async () => {
    console.log('Node1 Ready');
});
```

- 订阅消息

```javascript
// 订阅事件
bridge.on('say', async (vo: IFrameMessage) => {
    // vo.getData(); # 获取请求数据
    // vo.getResult(); # 获取响应结果
    return '我是 Main';
});

// 取消订阅事件
bridge.off('say');
```

- 请求&响应

```javascript
// 请求指定窗口
bridge.request({
    name: 'Node1', // 窗口名称（默认是 Main）
    method: 'say', // 方法名称
}).then((message: string) => {
    console.log('say.then', message);
}).catch((error: Error) => {
    console.log('say.catch', error);
});

// 请求上级页面（任意层级的直接上级）
bridge.request({
    name: 'Parent',
    method: 'say',
});

// 请求顶级页面
bridge.request({
    name: 'Main',
    method: 'say',
});
```

## 实现原理

- 示例 `iframe` 嵌套层级
    - `Main`
        - `Main/Node1`
            - `Main/Node1/Node1-1`
            - `Main/Node1/Node1-2`
        - `Main/Node2`
            - `Main/Node2/Node2-1`
            - `Main/Node2/Node2-2`

- 向上请求 `Main/Node1/Node1-1` 到 `Main`
    - `<Assuming the full path has been obtained>`
    - `Main/Node1/Node1-1` 请求 **↑↑↑** 到 `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` 转发 **↑↑↑** 到 `Main`
        **tracks[`{Node1-1:U}, {Node1:U}`]**
    - `Main` 处理逻辑
    - `Main` 响应 **↓↓↓** 到 `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` 转发 **↓↓↓** 到 `Main/Node1/Node1-1`
        **tracks[]**
    - `Main/Node1/Node1-1` 收到响应

- 向下请求 `Main` 到 `Main/Node1/Node1-1`
    - `<Assuming the full path has been obtained>`
    - `Main` 请求 **↓↓↓** 到 `Main/Node1`
        **tracks[`{Main:D}`]**
    - `Main/Node1` 转发 **↓↓↓** 到 `Main/Node1/Node1-1`
        **tracks[`{Main:D}, {Node1:D}`]**
    - `Main/Node1/Node1-1` 处理逻辑
    - `Main/Node1/Node1-1` 响应 **↑↑↑** 到 `Main/Node1`
        **tracks[`{Main:D}`]**
    - `Main/Node1` 转发 **↑↑↑** 到 `Main`
        **tracks[]**
    - `Main` 收到响应

- 同级请求 `Main/Node1/Node1-1` 到 `Main/Node1/Node1-2`
    - `<Assuming the full path has been obtained>`
    - `Main/Node1/Node1-1` 请求 **↑↑↑** 到 `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` 转发 **↓↓↓** 到 `Main/Node1/Node1-2`
        **tracks[`{Node1-1:U}, {Node1:D}`]]**
    - `Main/Node1/Node1-2` 处理逻辑
    - `Main/Node1/Node1-2` 响应 **↑↑↑** 到 `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` 转发 **↓↓↓** 到 `Main/Node1/Node1-1`
        **tracks[]**
    - `Main/Node1/Node1-1` 收到响应

- 跨级请求 `Main/Node1/Node1-1` 到 `Main/Node2/Node2-1`
    - `<Assuming the full path has been obtained>`
    - `Main/Node1/Node1-1` 请求 **↑↑↑** 到 `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` 转发 **↑↑↑** 到 `Main`
        **tracks[`{Node1-1:U}, {Node1:U}`]**
    - `Main` 转发 **↓↓↓** 到 `Main/Node2`
        **tracks[`{Node1-1:U}, {Node1:U}, {Main:D}`]**
    - `Main/Node2` 转发 **↓↓↓** 到 `Main/Node2/Node2-1`
        **tracks[`{Node1-1:U}, {Node1:U}, {Main:D}, {Node2:D}`]**
    - `Main/Node2/Node2-1` 处理逻辑
    - `Main/Node2/Node2-1` 响应 **↑↑↑** 到 `Main/Node2`
        **tracks[`{Node1-1:U}, {Node1:U}, {Main:D}`]**
    - `Main/Node2` 转发 **↑↑↑** 到 `Main`
        **tracks[`{Node1-1:U}, {Node1:U}`]**
    - `Main` 转发 **↓↓↓** 到 `Main/Node1`
        **tracks[`{Node1-1:U}`]**
    - `Main/Node1` 转发 **↓↓↓** 到 `Main/Node1/Node1-1`
        **tracks[]**
    - `Main/Node1/Node1-1` 收到响应
