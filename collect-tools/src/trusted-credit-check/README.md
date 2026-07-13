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
  --memory 1024 \
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
  concept; not fine for production secrets. See attestation / KMS
  discussion from the original chat if you need that.
- `RES_NOT_VERIFIED` and `RES_ERROR` share the same wire value (`2`) —
  the client can't currently distinguish them.
- `node-vsock` (0.0.3) is a low-adoption, single-maintainer native addon.
  Worth reviewing before using in anything beyond a prototype.



## RUN

### py

docker build -t server .
nitro-cli build-enclave --docker-uri server --output-file server.eif
nitro-cli terminate-enclave --all
nitro-cli run-enclave --eif-path server.eif --cpu-count 2 --memory 1024 --debug-mode
nitro-cli describe-enclaves

EID=i-0a2459b4443945db9-enc19f583ff885291f
nitro-cli console --enclave-id $EID


python3 vsock-sample.py client $ENCLAVE_CID 5005
