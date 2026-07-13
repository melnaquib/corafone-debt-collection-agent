#!/usr/bin/env bash
set -euo pipefail

echo "Creating project files..."

# ---------- constants.ts ----------
cat > constants.ts << 'EOF'
// constants.ts — shared by both server and client
export const SECRET_ACCOUNT_BALANCE = 42;

export const RES_FALSE = 0;
export const RES_TRUE = 1;
export const RES_NOT_VERIFIED = 2;
export const RES_ERROR = 2; // same wire value as RES_NOT_VERIFIED

export const VSOCK_PORT = 5000;
EOF

# ---------- server.ts ----------
cat > server.ts << 'EOF'
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
EOF

# ---------- client.ts ----------
cat > client.ts << 'EOF'
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
EOF

# ---------- package.json ----------
cat > package.json << 'EOF'
{
  "name": "trusted-credit-check",
  "version": "1.0.0",
  "dependencies": {
    "node-vsock": "0.0.3"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
EOF

# ---------- tsconfig.json ----------
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": ".",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["server.ts", "client.ts", "constants.ts"]
}
EOF

# ---------- Dockerfile ----------
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.ts constants.ts tsconfig.json ./

RUN npm install -g typescript && tsc

CMD ["node", "server.js"]
EOF

# ---------- README.md ----------
cat > README.md << 'EOF'
# trusted-credit-check

Minimal AWS Nitro Enclave demo: server inside the enclave compares a number
sent over vsock against a secret value, returns 0 (false), 1 (true), or 2
(error / not verified).

## Files

- `server.ts` — runs inside the enclave, listens on vsock port 5000
- `client.ts` — runs outside (on the parent EC2 instance), sends a number
- `constants.ts` — shared codes/port so client and server can't drift
- `package.json`, `tsconfig.json` — build config
- `Dockerfile` — builds the enclave image

## Prerequisites

- An EC2 instance type that supports Nitro Enclaves (e.g. `m5.xlarge`+),
  launched with **Nitro Enclaves enabled**.
- Nitro Enclaves CLI installed and enclave allocator configured:
  ```bash
  sudo yum install aws-nitro-enclaves-cli aws-nitro-enclaves-cli-devel -y
  sudo usermod -aG ne ec2-user
  sudo usermod -aG docker ec2-user
  # log out / back in for group changes to apply
  sudo systemctl start nitro-enclaves-allocator.service
  sudo systemctl enable nitro-enclaves-allocator.service
  ```
- Docker installed and running.
- Node.js 20+ (for running the client outside the enclave).

## 1. Install dependencies

```bash
npm install
```

This generates `package-lock.json`.

## 2. Build the Docker image

```bash
docker build -t server .
```

## 3. Convert to an Enclave Image File (EIF)

```bash
nitro-cli build-enclave --docker-uri server:latest --output-file server.eif
```

This prints PCR (measurement) hashes — save these if you plan to gate
KMS decryption or attestation on this exact image later.

## 4. Run the enclave

```bash
nitro-cli run-enclave \
  --eif-path server.eif \
  --cpu-count 2 \
  --memory 512 \
  --enclave-cid 16
```

Check it's running:

```bash
nitro-cli describe-enclaves
```

View enclave console output (useful for debugging `server.ts` logs):

```bash
nitro-cli console --enclave-id <enclave-id-from-describe-enclaves>
```

## 5. Run the client (on the parent instance, outside the enclave)

```bash
npx ts-node client.ts
```

Or compile and run:

```bash
npx tsc client.ts constants.ts
node client.js
```

`client.ts` is hardcoded to connect to CID `16` (matching `--enclave-cid 16`
above) on port `5000`, and sends the value `100`. Edit the `check(100)` call
at the bottom of `client.ts` to test other values against
`SECRET_ACCOUNT_BALANCE` (currently `42` in `constants.ts`).

## Stopping the enclave

```bash
nitro-cli terminate-enclave --enclave-id <enclave-id>
```

or terminate all:

```bash
nitro-cli terminate-enclave --all
```

## Notes / limitations

- No encryption or attestation in this minimal version — the input number
  crosses the vsock channel in plaintext, and the client has no way to
  verify it's really talking to an unmodified enclave. Fine for a proof of
  concept; not fine for production secrets.
- `RES_NOT_VERIFIED` and `RES_ERROR` share the same wire value (`2`) —
  the client can't currently distinguish them.
- `node-vsock` (0.0.3) is a low-adoption, single-maintainer native addon.
  Worth reviewing before using in anything beyond a prototype.
EOF

echo "Done. Files created:"
echo "  constants.ts"
echo "  server.ts"
echo "  client.ts"
echo "  package.json"
echo "  tsconfig.json"
echo "  Dockerfile"
echo "  README.md"
echo ""
echo "Next steps:"
echo "  npm install          # generates package-lock.json"
echo "  docker build -t vsock-server ."
echo "  nitro-cli build-enclave --docker-uri vsock-server:latest --output-file server.eif"
