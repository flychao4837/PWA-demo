<template>
  <div id="app">
    <img src="./assets/logo.png">
    <HelloWorld/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld'

import InstallPWA from './scripts/installPWA'
export default {
  name: 'App',
  components: {
    HelloWorld
  },
  data(){
    return {
      message: "test"
    }
  },
  mounted() {
    new InstallPWA();
    this.worker = new Worker("./static/workers/testWorker.js");
    this.worker.postMessage({cmd : "time"});
    this.worker.onmessage = this.onMessage;

    //测试传入自定义函数来构建worker，注意变量作用域
    var str = `let result = 0;
      addEventListener("message",function(e){
        console.log(e)
        let data = e.data;
        result = data.a + data.b;
        postMessage({result:result});
      });`;

    var workerBolb = new Blob([str]);
    var url = window.URL.createObjectURL(workerBolb);
    this.workerA = new Worker(url)
    
    this.workerA.onmessage = this.onMessage;
    this.workerA.postMessage({a:1,b:2})
  },
  methods:{
    onMessage:function(event) {
        console.log('Received message ', event.data);
        // this.worker.postMessage({cmd : "stop"});
    },

    boldAwoker: function(){
      let result = 0;
      addEventListener("message",function(e){
        let data = e.data;
        result = data.a + data.b;
      });
      postMessage({result:result});
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
