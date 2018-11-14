/**
 * 注册安装Service Worker
 */
import Vue from 'vue';

const Version = "1.0.0"; //当前版本号
class InstallPWA {
    constructor() {
        this.install();
    }

    //Service Worker 安装、注册
    install() {
        if ('serviceWorker' in navigator) {

        navigator.serviceWorker.register('/sw.js', {scope: '/'})
            .then(
                (registration) => {
                    console.log('ServiceWorker 注册成功！作用域为: ', registration.scope);
                    //人为控制cache更新方式1：安装时设置版本号，根据版本号做本地更新比对
                    if(localStorage.getItem("ws_version") !== Version){
                        //Note -- 注意 update是一个异步操作，不能立即得到serviceWorker.controller，注意回调的顺序
                        registration.update().then(
                            ()=>{
                                localStorage.setItem("ws_version", Version);
                                this.bindAct();
                            }
                        )
                    }else{
                        this.bindAct();
                    }
                    
                }
            )
            .catch(err => console.log('ServiceWorker 注册失败: ', err));
        }
    }
    
    bindAct(){
        //添加通知
        //this.addNotify();

        //ServiceWorker注册成功后才能向ServiceWorker发送数据,但是此时ServiceWorker.controller不一定建立完毕，可能处于activing中
        this.sendMessageToServiceWorker('hello sw!');
        
        this.getPostMessage();
    }

    //Notification -- 消息订阅
    //不同浏览器需要用不同的推送消息服务器。以 Chrome 上使用 Google Cloud Messaging<GCM> 作为推送服务(需要注册Key)
    //浏览器按需求去设置Mainfast.json，用于展示通知主题相关的theme
    addNotify(){
        // 向用户申请通知权限，用户可以选择允许或禁止
        // Notification.requestPermission 只有在页面上才可执行，Service Worker 内部不可申请权限
        Notification.requestPermission().then(grant => {
            console.log(grant); // 如果获得权限，会得到 granted
            if (Notification.permission === 'denied') {
                // 用户拒绝了通知权限
                console.log('Permission for Notifications was denied');
            }
        });

        let reg;
        const applicationServerKey = 'xxx'; // 应用服务器的公钥（base64 网址安全编码）
        navigator.serviceWorker.ready.then(_reg => {
            reg = _reg;
            // 获取当前订阅的推送
            return reg.pushManager.getSubscription();
        })
        .then(subscription => {
            // 获取的结果没有任何订阅，发起一个订阅
            if (!subscription) {
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });
            } else {
                // 每一个会话会有一个独立的端点(endpoint)，用于推送时后端识别
                return console.log("已订阅 endpoint:", subscription.endpoint);
            }
        })
        .then(subscription => {
            if (!subscription) {
                return;
            }

            // 订阅成功
            console.log('订阅成功！', subscription.endpoint);

            // 做更多的事情，如将订阅信息发送给后端
            //sendMessageToServiceWorker
        })
        .catch(function (e) {
            // 订阅失败
            console.log('Unable to subscribe to push.', e);
        });
    }

    //PostMessage -- 向service worker发送数据
    //与iframe传递数据的PostMessage方法的异同，同属于HTML5的PostMessage方法
    sendMessageToServiceWorker(msg) {
        const controller = navigator.serviceWorker.controller;
        debugger
        if (!controller) {
            return;
        }
        controller.postMessage(msg, []);
    }

    //接受PostMessage数据
    //serviceWorker,worker,window 三种场景下的postMessage主体是不一样的，在不同场景下要取对应的对象窗体
    getPostMessage(){
        navigator.serviceWorker.addEventListener('message', (e) => {
            console.log("从serviceworker收到消息",e)
            //TODO -- 这里对收到的消息做origin验证，根据不同类型做不同的处理（switch）
        });
    }
}

export default InstallPWA;
