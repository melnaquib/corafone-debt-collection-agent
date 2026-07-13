import { VsockSocket } from "node-vsock";
import {
  RES_FALSE,
  RES_TRUE,
  RES_NOT_VERIFIED,
  RES_ERROR,
  VSOCK_PORT,
} from "./constants";

const ENCLAVE_CID = 16;

function check(inputValue: number): void {
  const client = new VsockSocket();

  client.on("error", (err: Error) => {
    console.error("client error:", err);
  });

  client.connect(ENCLAVE_CID, VSOCK_PORT, () => {
    client.on("data", (buf: Buffer) => {
      const result = Number(buf.toString("utf8").trim());
      switch (result) {
        case RES_TRUE:
          console.log("greater than secret");
          break;
        case RES_FALSE:
          console.log("not greater than secret");
          break;
        case RES_NOT_VERIFIED:
        case RES_ERROR:
          console.log("could not verify / error");
          break;
        default:
          console.log("unexpected response:", buf.toString());
      }
      client.end();
    });

    client.writeTextSync(String(inputValue));
  });
}

check(100);

const SERVER_CID = 16;
const SERVER_PORT = 50005;

function sleep(s:number) {
  return new Promise((resolve) => {
    setTimeout(resolve, s*1000);
  });
}

function credit_check(amount: number): Promise<number> {
  console.log("start sample client..")

  return new Promise((resolve, reject) => {
    const client = new VsockSocket();

    client.on('error', (err: Error) => {
      console.log("err: ", err)
      reject(err);
    });

    const bankCid = Number(process.env.BANK_CID);
    if (!process.env.BANK_CID || Number.isNaN(bankCid)) {
      reject(new Error('BANK_CID environment variable must be set to a valid vsock CID'));
      return;
    }

    client.connect(bankCid, SERVER_PORT, async () => {
      const data = ['hello, ', 'w', 'o', 'r', 'l', 'd'];

      client.on('data', (buf: Buffer) => {
        console.log("recv: ", buf.toString());
        resolve(Number(buf.toString("utf8").trim()));
      })

      for (const str of data) {
        console.log("send: ", str)
        client.writeTextSync(str);
        await sleep(10);
      }

      // await sleep(20);
      client.end();
    });

    console.log("end sample client.")
  });
}

async function main() {
  console.log("start sample client..")

  const client = new VsockSocket();
  
  client.on('error', (err:Error) => {
    console.log("err: ", err)
  });

  client.connect(15, 9001, async () => {
    const data = ['hello, ', 'w', 'o', 'r', 'l', 'd'];

    client.on('data', (buf: Buffer) => {
      console.log("recv: ", buf.toString())
    })
  
    for (const str of data) {
      console.log("send: ", str)
      client.writeTextSync(str);
      await sleep(3);
    }
  
    // await sleep(20);
    client.end();
  });

  console.log("end sample client.")
}

main()