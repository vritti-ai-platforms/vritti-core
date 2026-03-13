# Local Development Setup

## SSL Certificates (for dev:ssl scripts)

### Prerequisites
- [mkcert](https://github.com/FiloSottile/mkcert) installed

### Generate Certificates

1. Install mkcert (macOS):
   ```bash
   brew install mkcert
   mkcert -install
   ```

2. Generate certificates:
   ```bash
   mkdir -p certs
   cd certs
   mkcert -key-file local.vrittiai.com+4-key.pem -cert-file local.vrittiai.com+4.pem \
     local.vrittiai.com cloud.local.vrittiai.com localhost 127.0.0.1 ::1
   ```


## Available Scripts

| Script | URL |
|--------|-----|
| `pnpm dev` | `http://local.vrittiai.com:3012` |
| `pnpm dev:ssl` | `https://local.vrittiai.com:3012` |
