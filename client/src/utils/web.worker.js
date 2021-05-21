/* eslint-disable */

import uuid from "uuid";
self.addEventListener("message", processFiles);

function processFiles(event) {
  if (event.data != "error") {
    const { files } = event.data;
    for (let i = 0; i < files.length; i++) {
      const dataId = uuid.v4();
      const metaData = JSON.stringify({ id: dataId, name: files[i].name, type: files[i].type, size: files[i].size });
      this.postMessage("Meta-" + metaData);
      files[i].arrayBuffer().then((buffer) => {
        while (buffer.byteLength) {
          const chunk = buffer.slice(0, 16 * 1024);
          buffer = buffer.slice(16 * 1024, buffer.byteLength);
          this.postMessage(chunk);
        }
        this.postMessage("Done");
      });
    }
  } else {
    this.terminate();
  }
}
