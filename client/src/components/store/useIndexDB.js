import Dexie from "dexie";

const db = new Dexie("bytebook");
//crete new database store
db.version(1).stores({ rooms: "roomId,roomName,roomData" });

db.open().catch((err) => {
  console.log(err);
});

export default db;
