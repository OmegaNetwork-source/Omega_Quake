# Deploy Omega Quake multiplayer server on Railway

> **Important:** The game server uses **WebTransport over QUIC (UDP)**. Railway’s proxy is **TCP-only** and does not support inbound UDP, so **multiplayer will not work on Railway** — you’ll see “Opening handshake failed.”  
> For multiplayer, use a host that supports **UDP** (e.g. **Fly.io**, or a **VPS** like DigitalOcean/Linode). See [Deploying multiplayer elsewhere](#if-railway-doesnt-work-use-flyio-or-a-vps) below.

This guide describes how to run the server on Railway (e.g. for testing the build). For working multiplayer, use Fly.io or a VPS.

## What you need

- A [Railway](https://railway.app) account
- This repo (with `pak0.pak` in the root)
- Optional: a domain and TLS certs for production (see step 5)

---

## Step 1: Create a new project and service

1. Go to [railway.app](https://railway.app) and open your dashboard.
2. **New Project** → **Deploy from GitHub repo**.
3. Select the **Omega_Quake** repo (or your fork).
4. Railway may auto-detect a Dockerfile. We’ll point it at the server Dockerfile in the next step.

---

## Step 2: Use the server Dockerfile

1. In the new service, go to **Settings**.
2. Under **Build**, set **Dockerfile path** to:  
   `Dockerfile.server`
3. Set **Root Directory** to the repo root (leave blank if the repo root is the project root).
4. **Save**.

---

## Step 3: Expose the server with TCP Proxy

The game uses **WebTransport over QUIC** on a single port (e.g. 4433), not HTTP. Railway’s **TCP Proxy** is what you need.

1. In the same service, go to **Settings** → **Networking**.
2. Enable **TCP Proxy**.
3. Set **Internal port** to `4433` (must match the port the server listens on).
4. Save. Railway will show a public address like:  
   `something.proxy.rlwy.net:12345`  
   (the port is chosen by Railway).

Your server URL for the game client will be:

```text
https://<TCP_PROXY_HOST>:<TCP_PROXY_PORT>
```

Example: `https://omega-quake-server.proxy.rlwy.net:15140`  
(use the host and port from the Railway TCP Proxy panel; the client uses `wts://` which is the secure WebTransport scheme.)

---

## Step 4: Set environment variables (optional)

In the service **Variables** tab you can set:

| Variable   | Description |
|-----------|-------------|
| `PORT`    | Port the server listens on. Set to `4433` so it matches the TCP Proxy internal port (recommended). |
| `PAK_PATH`| Path to `pak0.pak` inside the container. Default is `/app/pak0.pak` (set by Dockerfile). Only change if you mount the file elsewhere. |
| `CERT_PEM`| (Production) Full TLS certificate PEM. If set, the server uses this instead of the built-in self-signed cert. |
| `KEY_PEM` | (Production) Full TLS private key PEM. Use with `CERT_PEM`. |

For a first deploy you can leave these unset: the image includes a self-signed cert so the server will start. Browsers will show a certificate warning; you can still test. For production, use `CERT_PEM` and `KEY_PEM` (see step 5).

---

## Step 5: Production TLS (recommended)

For a proper certificate (no browser warning):

1. **Custom domain for TCP**
   - In your DNS provider, add a CNAME for a subdomain (e.g. `wt.yourdomain.com`) pointing to the Railway TCP Proxy host (e.g. `something.proxy.rlwy.net`), **without** the port.
   - In Railway, the TCP Proxy port stays as shown; clients use `wt.yourdomain.com:<port>`.

2. **Get a certificate**
   - You need a cert for `wt.yourdomain.com`. Railway doesn’t terminate TLS for TCP; the server does. So get a PEM cert/key (e.g. Let’s Encrypt via certbot or another provider).  
   - If you use **Cloudflare**, use “DNS only” (grey cloud) for that record so the TCP connection goes straight to Railway.

3. **Add certs to Railway**
   - In the service **Variables**, add:
     - `CERT_PEM`: paste the full certificate (including `-----BEGIN CERTIFICATE-----` / `-----END CERTIFICATE-----`).
     - `KEY_PEM`: paste the full private key.
   - Redeploy. The server will use these instead of the self-signed cert.

---

## Step 6: Point the game client at your server

1. Copy the **public server URL** from Railway (TCP Proxy):  
   `https://<host>:<port>` (e.g. `https://omega-quake-server.proxy.rlwy.net:15140`).

2. In the **frontend** (this repo), set the default WebTransport server:
   - Open `src/menu.js` and set:
     ```js
     const DEFAULT_WT_SERVER = 'https://YOUR_RAILWAY_TCP_HOST:YOUR_PORT';
     ```
     Example: `const DEFAULT_WT_SERVER = 'https://omega-quake-server.proxy.rlwy.net:15140';`
   - Or, if you build the frontend with an env-based URL, use that (e.g. `VITE_WT_SERVER` or similar) and set it in Vercel to the same `https://...` URL.

3. In the game, multiplayer uses **wts://**; the client will turn `https://` into `wts://` when connecting. So the value in `DEFAULT_WT_SERVER` (or in your env) should be the `https://...` form.

4. Redeploy the frontend on Vercel so players get the updated default server.

---

## Step 7: Deploy and test

1. In Railway, trigger a **Deploy** (or push to the linked branch).
2. Wait for the build and run to succeed. Check **Logs** for:
   - `WebTransport server listening on port 4433` (or whatever port you use).
3. Open your game on Vercel, go to **Multiplayer** → **Find games**. The room list should load from your Railway server.
4. Create a room and join; connection should be `wts://` to your Railway TCP host:port.

---

## Troubleshooting

- **“Connection timed out” or room list never loads**  
  - Confirm TCP Proxy is enabled and internal port is `4433` (or whatever `PORT` is).  
  - Confirm the URL in the client uses the **exact** host and port from the Railway TCP Proxy (including the port).

- **Certificate / security warning**  
  - Expected with the built-in self-signed cert. For production, use a real cert via `CERT_PEM` / `KEY_PEM` and a custom domain.

- **Server exits or “Failed to load pak0.pak”**  
  - Ensure `pak0.pak` is in the repo root so the Docker build can copy it. The Dockerfile copies it to `/app/pak0.pak` and runs with `-pak /app/pak0.pak`.

- **Port mismatch**  
  - Server reads `PORT` from the environment (default 4433). Set `PORT=4433` in Railway and set TCP Proxy internal port to `4433` so they match.

- **“Opening handshake failed” in the game**  
  - The server uses **QUIC (UDP)**. Railway does **not** support inbound UDP, so the handshake never completes. Use [Fly.io or a VPS](#if-railway-doesnt-work-use-flyio-or-a-vps) instead.

---

## If Railway doesn’t work: use Fly.io or a VPS

WebTransport/QUIC needs **UDP**. Railway only proxies TCP, so multiplayer will not work there.

**Option A: Fly.io**  
Fly.io allows UDP. Create an app, set an internal UDP port (e.g. 4433), and use the same `Dockerfile.server` and env (e.g. `CERT_PEM`/`KEY_PEM` if you use a custom domain). Expose the app with `fly proxy` or a public IP and set `DEFAULT_WT_SERVER` in the game to `https://<your-fly-app-host>:<port>`.

**Option B: VPS (DigitalOcean, Linode, etc.)**  
1. Create a small VM (e.g. Ubuntu).  
2. Install Docker, clone the repo, build with `Dockerfile.server`, run the container with port 4433 (UDP) exposed.  
3. Point a domain (e.g. `wt.omeganetwork.co`) to the VPS IP.  
4. Use Let’s Encrypt (e.g. `certbot certonly --standalone -d wt.omeganetwork.co`) and pass the cert/key to the server via env or files.  
5. Set `DEFAULT_WT_SERVER` in the game to `https://wt.omeganetwork.co:4433` (or your chosen port).

---

## Summary

| Where        | What |
|-------------|------|
| **Railway** | One service: build with `Dockerfile.server`, enable TCP Proxy on port 4433, optional `CERT_PEM`/`KEY_PEM`. |
| **Vercel**  | Frontend only; set `DEFAULT_WT_SERVER` (or env) to `https://<railway-tcp-host>:<port>`. |
| **Client**  | Uses `wts://` to the same host:port for matchmaking and gameplay. |

Once this is in place, matchmaking and multiplayer use your Railway server instead of Render or the old default host.
