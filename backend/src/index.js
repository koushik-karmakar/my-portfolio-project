import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { app } from "./app.js";
import http from "http";
import { connectionDB } from "./database/db.js";

const server = http.createServer(app);
// this async function return a Promise so that we can work with it and handle it properly
connectionDB()
  .then(() => {
    server.on("error", (error) => {
      console.log("Express Error:" + error);
      throw error;
    });
    server.listen(process.env.PORT, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Database failed to connect!! ${err}`);
  });
