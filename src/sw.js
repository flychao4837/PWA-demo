// 用于标注创建的缓存，也可以根据它来建立版本规范
const CACHE_NAME = "local_cache_v1.1.0";
// 列举要默认缓存的静态资源，一般用于离线使用
const urlsToCache = [
    'favicon.ico',
    'offline.html',
    'static/assets/offline.jpg',
    'index.html',
    'static/assets/logo.png',
    "static/assets/main.css"
];
const excludeFiles = [
    "app.js",
    'static/workers/testWorker.js',
    'static/workers/workA.js'
]

//WorkerLocation, service worker专有对象,表明serviceworker文件绝对地址
const location = self.location;
const origin = location.origin;

// self 为当前 scope 内的上下文

//脚本安装时触发install事件
self.addEventListener('install', event => {
    // event.waitUtil 用于在安装成功之前执行一些预装逻辑
    // 但是建议只做一些轻量级和非常重要资源的缓存，减少安装失败的概率
    // 安装成功后 ServiceWorker 状态会从 installing 变为 installed
    // 使用 cache API 打开指定的 cache 文件

    // event.waitUntil(
    //     // 使用 cache API 打开指定的 cache 文件
    //     caches.open(CACHE_NAME).then(cache => {
    //         console.log(cache);
    //         // 添加要缓存的资源列表
    //         return cache.addAll(urlsToCache);
    //     })
    // );

    //人为控制cache更新方式2：SW安装时跳过安装阶段，先删除本地cache，直接加载线上最新资源。
    //跳过安装阶段，直接进入active阶段

    event.waitUntil(self.skipWaiting())
});

//安装完成，触发激活状态
self.addEventListener('activate', event => event.waitUntil(
    console.log("activate", event),
    
    Promise.all([
        // 更新客户端
        clients.claim(),
        // 清理旧版本
        caches.keys().then(cacheList => Promise.all(
            cacheList.map(cacheName => {
                if (cacheName !== CACHE_NAME) {
                    caches.delete(cacheName);
                }
            })
        ))
    ])
    .then(
        ()=>{
            caches.open(CACHE_NAME).then(cache => {
                console.log(cache);
                // 添加要缓存的资源列表
                return cache.addAll(urlsToCache);
            })
        }
    )
    .catch(
        (err) =>{
            console.error(err);
        }
    )
));


//通过fetch事件拦截浏览器的HTTP/HTTPS请求
// 联网状态下执行
function onlineRequest(fetchRequest) {
    console.log("使用在线资源", fetchRequest.url)
    // 使用 fecth API 获取资源，以实现对资源请求控制
    return fetch(fetchRequest).then(response => {
        // 在资源请求成功后，将 image、js、css 资源加入缓存列表
        if (!response || response.status !== 200 || !response.headers.get('Content-type').match(/image|javascript|text\/css/i)) {
            return response;
        }

        //TODO -- 不能把所有文件都加入cache，调试文件或webpack打包文件要排除
        for(let i in excludeFiles){
            let fileName = excludeFiles[i]
            if (fetchRequest.url.match( new RegExp(fileName,"i"))) {
                return response;
            }
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log("缓存在线资源", fetchRequest.url)
                cache.put(fetchRequest, responseToCache);
            })

        return response;
    }).catch(() => {
        // 获取失败，离线资源降级替换
        offlineRequest(fetchRequest);
    });
}
// 离线状态下执行，降级替换
function offlineRequest(request) {
    console.log("使用离线资源", request.url)

    // 使用离线图片,静态页面样式表，js
    if (request.url.match(/\.(png|gif|jpg|html|css|js)/i)) {
        let filePath = request.url.replace(origin, "")
        return caches.match(filePath);
    }

    // // 使用离线js
    // if (request.url.match(/(\w+?).js$/)) {
    //     let fileName = request.url.match(/([\w.]+).js$/)[1]
    //     let filePath = request.url.replace(origin, "")
    //     return caches.match(filePath);
    // }

    //本地调试用，对"/"的访问path，直接导向首页index
    if (request.url.match(/http\:\/\/localhost:8080\/$/)) {
        return caches.match('index.html');
    }
}

//Service Worker监听http/https，通过fetch加载文件
self.addEventListener('fetch', event => {
    console.log("fetch", event.request.url);
    event.respondWith(
        caches.match(event.request)
        .then(hit => {
            // 返回缓存中命中的文件
            if (hit) {
                return hit;
            }

            const fetchRequest = event.request.clone();

            if (navigator.onLine) {
                // 如果为联网状态
                return onlineRequest(fetchRequest);
            } else {
                // 如果为离线状态
                return offlineRequest(fetchRequest);
            }
        })
        .catch(
            (err) =>{
                console.log("fetch err", err)
            }
        )
    );
});

//Notification -- 消息订阅和推送
//在 Service Worker 中通过监听 push 事件对推送的消息作处理
self.addEventListener('push', function(event) {
    // 读取 event.data 获取传递过来的数据，根据该数据做进一步的逻辑处理
    const obj = event.data.json();

    // 逻辑处理示例
    if(Notification.permission === 'granted' && obj.action === 'subscribe') {
        self.registration.showNotification("Hi：", {
            body: '订阅成功 ~',
            icon: 'static/assets/logo.png',
            tag: 'push'
        });
    }
});

//PostMessage -- 页面和service worker之间的数据传输
//向特定的页面传递数据
function PostMessageToClient(msg){
    self.clients.matchAll().then(clientList => {
        clientList.forEach(client => {
            console.log("client", client);
            //TODO -- 这里的Client：WindowClient并没有postMessage方法
            client.postMessage('Hi, I am send from Service worker！');
        })
    });
}
//接收页面传来的数据
self.addEventListener('message', function(ev) {
    console.log(ev.data);
    PostMessageToClient("haha")
});



