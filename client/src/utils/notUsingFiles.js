/* eslint-disable */

function sendFile(e) {
  //setFile((prev) => e.target.files);
  try {
    let file = e.target.files;
    console.log("Files Length", file.length);
    for (var i = 0; i < file.length; i++) {
      console.log("file", file[i]);
      if (file[i].size > 20 * 1024 * 1024) {
        return alert("File size limit exceeded. Limit is 100 mb");
      }
      const dataId = uuid.v4();
      const metaData = JSON.stringify({ id: dataId, name: file[i].name, type: file[i].type, size: file[i].size });
      const metaObj = JSON.parse(metaData);
      console.log(metaData);
      setRoomData((prev) => [...prev, { id: dataId, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Sending" }]);
      file[i].arrayBuffer().then((buffer) => {
        sendChannel.current.send(`Meta-${metaData}`);
        while (buffer.byteLength) {
          const chunk = buffer.slice(0, 16 * 1024);
          buffer = buffer.slice(16 * 1024, buffer.byteLength);
          sendChannel.current.send(chunk);
        }
        sendChannel.current.send(`Done-${metaData}`);
        setCurrentFile((prev) => [...prev, JSON.parse(metaData)]);
        const DataArr = roomData.filter((data) => data.id !== dataId);
        DataArr.push({ id: dataId, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Sent" });
        setRoomData((prev) => DataArr);
        roomArr.current.push({ id: dataId, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Sent" });
        db.rooms.update({ roomId: roomId }, { roomData: roomArr.current });
      });
    }
  } catch (err) {
    console.log(err);
  }
}
