# Running your own multiplayer server

The game needs a **WebTransport server** that speaks **QUIC (UDP)** on one port (e.g. 4433). The public server `wts.mrdoob.com` is down, so to have multiplayer you need to run the server yourself.

## Will it be free?

| Option | Cost | UDP support |
|--------|------|-------------|
| **Oracle Cloud Always Free** | **Free** (credit card required, no charge for Always Free tier) | Yes – open UDP in firewall |
| **Fly.io** | ~**$3.60/month** (dedicated IPv4 required for UDP) | Yes, with paid IPv4 |
| **Cheap VPS** (DigitalOcean, Linode, Vultr) | **~$4–6/month** | Yes |
| **Railway** | N/A | **No** – TCP only, multiplayer won’t work |

**Free option:** Oracle Cloud Always Free tier (VPS with UDP).  
**Cheap option:** Fly.io (~$3.60/mo) or a $4–6/mo VPS.

---

## What you need to do (any option)

1. **Run the game server** – Same app as in `Dockerfile.server` (Deno + WebTransport), listening on **UDP** port **4433**.
2. **Expose UDP 4433** – Firewall / cloud security rules must allow **inbound UDP** on 4433.
3. **TLS** – Browsers require HTTPS for WebTransport. Use a **domain** and a **TLS certificate** (e.g. Let’s Encrypt, free).
4. **Point the game at your server** – Set `DEFAULT_WT_SERVER` in `src/menu.js` to `https://your-domain:4433`, then redeploy the frontend on Vercel.

---

## Option 1: Oracle Cloud Always Free (free)

1. **Sign up:** [Oracle Cloud](https://www.oracle.com/cloud/free/) – Always Free tier. Credit card is required but you are not charged for Always Free resources.
2. **Create a VM:** Ubuntu 22.04, 1–4 GB RAM (ARM Ampere gives more RAM for free).
3. **Open UDP 4433:** In Oracle Cloud → your VCN → Security List → Ingress rules: add **UDP, port 4433**, source 0.0.0.0/0.
4. **On the VM:** Install Docker, clone your repo, then:
   ```bash
   docker build -f Dockerfile.server -t omega-quake-server .
   docker run -d --name quake-server -p 4433:4433/udp -e PORT=4433 omega-quake-server
   ```
   (For production you’ll add a domain and TLS – see below.)
5. **Domain + TLS (recommended):** Point a subdomain (e.g. `wt.omeganetwork.co`) to the VM’s public IP. Get a free cert with Let’s Encrypt (e.g. `certbot certonly --standalone -d wt.omeganetwork.co`), then run the server with `-cert` and `-key` (or `CERT_PEM` / `KEY_PEM` env vars). Set `DEFAULT_WT_SERVER` to `https://wt.omeganetwork.co:4433`.
6. **Without a domain (quick test):** You can run with the self-signed cert in the image and use the VM’s public IP in `DEFAULT_WT_SERVER` (e.g. `https://YOUR_IP:4433`). Browsers will show a certificate warning; you may need to accept it or use a test build that allows insecure.

---

## Option 2: Fly.io (~$3.60/month)

- Fly.io supports **UDP** but requires a **dedicated IPv4** (paid).
- Create an app, use `Dockerfile.server`, expose **UDP 4433** in `fly.toml` and bind the server to Fly’s `fly-global-services` address as per [Fly UDP docs](https://fly.io/docs/networking/udp-and-tcp/).
- Set `DEFAULT_WT_SERVER` to your Fly app URL (e.g. `https://your-app.fly.dev:4433` or the dedicated IP and port Fly gives you).

---

## Option 3: Paid VPS (~$4–6/month)

- Create a small Ubuntu VM (DigitalOcean, Linode, Vultr, etc.).
- Open **UDP 4433** in the cloud firewall and (if used) UFW on the VM.
- Same as Oracle: install Docker, build and run `Dockerfile.server`, then add a domain + Let’s Encrypt and set `DEFAULT_WT_SERVER` to `https://your-domain:4433`.

---

## Summary

- **Free:** Oracle Cloud Always Free + open UDP 4433 + (optionally) domain + Let’s Encrypt.
- **Cheap:** Fly.io with dedicated IPv4 or a small VPS.
- **Required in all cases:** Run the same WebTransport server, expose **UDP 4433**, use TLS (domain + cert), and set `DEFAULT_WT_SERVER` in the game.
