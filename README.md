# Bytebook P2P File Sharing Web App

![](https://img.shields.io/github/issues/saivishwak/WebrtcFileShare
)
![](https://img.shields.io/github/issues/saivishwak/WebrtcFileShare
)
![](https://img.shields.io/github/stars/saivishwak/WebrtcFileShare
)

Bytebook P2P is a file sharing web app that allows **users to transfer files between multiple devices.**
It uses WebRTC peer-peer connections to share file between users and socket for initial handsake. The app also has web workers to remove the load on client for large data transfers and IndexDB to store files meta data. Your files are not transfered through any central server so you have more privacy.

### Features
- No account creation or signups.
- One-to-One file transfers.
- Works across different networks and devices.

### Try it out!
- Go to a deployed client - https://p2p.bytebook.co
- Set a your name (this is store locally in your browser)
- Create a new room. Room is where peers must join to share files among each other.
- On another device, follow the above steps and join the same room.
- Both your devices should show up. Now start sharing some files!
 

**Starting the client**
```bash
npm start
```
The client built code is located in the `client/build` directory.

**Starting the server**
```bash
npm run dev
```

## License
Bytebook P2P is [MIT Licensed](https://github.com/saivishwak/WebrtcFileShare/blob/main/LICENSE)
