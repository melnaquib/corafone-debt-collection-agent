import { VsockServer, VsockSocket } from "node-vsock";
import {
  SECRET_ACCOUNT_BALANCE,
  RES_FALSE,
  RES_TRUE,
  RES_ERROR,
  VSOCK_PORT,
} from "./constants";

function handleData(socket: VsockSocket, buf: Buffer): void {
  let result: number;
  try {
    const raw = buf.toString("utf8").trim();
    const input = Number(raw);
    if (raw === "" || Number.isNaN(input)) {
      throw new Error(`invalid input: "${raw}"`);
    }
    result = input > SECRET_ACCOUNT_BALANCE ? RES_TRUE : RES_FALSE;
  } catch (err) {
    console.error("decode/compare error:", err);
    result = RES_ERROR;
  }

  try {
    socket.writeTextSync(String(result)); // "0" | "1" | "2"
  } catch (err) {
    console.error("write error:", err);
  }
}

function main(): void {
  const server = new VsockServer();

  server.on("error", (err: Error) => {
    console.error("server error:", err);
  });

  server.on("connection", (socket: VsockSocket) => {
    console.log("new connection");
    socket.on("error", (err: Error) => {
      console.error("socket error:", err);
    });
    socket.on("data", (buf: Buffer) => handleData(socket, buf));
  });

  server.listen(VSOCK_PORT);
  console.log(`Server listening on vsock port ${VSOCK_PORT}`);
}

main();

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});
