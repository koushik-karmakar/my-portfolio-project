import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { app } from "./app.js";
import http from "http";
import { connectionDB } from "./database/db.js";
import { socketConnect } from "./socket.js";
const server = http.createServer(app);
// this async function return a Promise so that we can work with it and handle it properly
connectionDB()
  .then(() => {
    server.on("error", (error) => {
      console.log("Express Error:" + error);
      throw error;
    });

    socketConnect(server, process.env.CORS_ORIGIN);
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Database failed to connect!! ${err}`);
  });
