//web worker
self.addEventListener('message', function (e) {
  var data = e.data;
  console.log("worker收到命令",data)
  switch (data.cmd) {
    case 'start':
      self.postMessage('WORKER STARTED: ' + data.msg);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg);
      self.close(); // Terminates the worker.
      break;
    case 'time':
      self.postMessage({
        time: "我是workerA"
      });
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);
