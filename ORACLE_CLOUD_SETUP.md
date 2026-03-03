# Omega Quake multiplayer on Oracle Cloud (Always Free)

Step-by-step guide to run the WebTransport game server on Oracle Cloud Always Free. You need a domain (e.g. `wt.omeganetwork.co`) for TLS so browsers will connect; the VM’s public IP works for testing but will show a certificate warning.

---

## 1. Sign up for Oracle Cloud

1. Go to **https://www.oracle.com/cloud/free/** and click **Start for free**.
2. Create an account. You’ll need:
   - Email
   - Country
   - Credit card (for verification; Always Free resources are not charged)
3. Choose your **region** (e.g. a nearby one). You can’t change it later.
4. After sign-up, log in to the **Oracle Cloud Console**.

---

## 2. Create a VM (Compute Instance)

1. In the console, open the **hamburger menu** (top left) → **Compute** → **Instances**.
2. Click **Create instance**.
3. **Name:** e.g. `omega-quake`.
4. **Placement:** keep default.
5. **Image and shape:**
   - Click **Edit** next to “Image and shape”.
   - **Image:** pick **Ubuntu 22.04**.
   - **Shape:**  
     - For more free RAM: **Ampere** → **VM.Standard.A1.Flex** → 1 OCPU, 6 GB memory (fits in Always Free).  
     - Or **AMD** → **VM.Standard.E2.1.Micro** (1 OCPU, 1 GB – minimal).
6. **Networking:** keep “Create new virtual cloud network” and “Create public IPv4 address”.
7. **Add SSH keys:**  
   - Choose **Generate a key pair for me**, click **Save private key** and **Save public key**. Store the private key somewhere safe (you’ll use it to SSH).
8. Click **Create**. Wait until the instance shows **Running** and note its **Public IP address**.

---

## 3. Open UDP port 4433 in Oracle firewall

1. In the console: **Networking** → **Virtual cloud networks**.
2. Click the VCN used by your instance (e.g. the one in the same compartment).
3. Under **Security**, click **Security Lists**.
4. Click the **Default Security List**.
5. **Ingress rules** → **Add ingress rules**:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP protocol:** UDP
   - **Source port range:** (leave blank)
   - **Destination port range:** `4433`
   - **Description:** e.g. `Omega Quake WebTransport`
6. Click **Add ingress rules**.

---

## 4. SSH into the VM

From your own computer (with the private key you saved):

```bash
ssh -i /path/to/your-private-key.key ubuntu@YOUR_PUBLIC_IP
```

(On Windows you can use PowerShell with the same command, or PuTTY after converting the key.)  
Replace `YOUR_PUBLIC_IP` with the instance’s public IP. Accept the host key if asked.

---

## 5. Install Docker on the VM

On the VM (after SSH):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker ubuntu
```

Then log out and log back in (or run `newgrp docker`) so `docker` works without `sudo`.

---

## 6. Clone the repo and run the server

Still on the VM:

```bash
cd ~
git clone https://github.com/OmegaNetwork-source/Omega_Quake.git
cd Omega_Quake
docker build -f Dockerfile.server -t omega-quake-server .
docker run -d --name quake-server --restart unless-stopped -p 4433:4433/udp -e PORT=4433 omega-quake-server
```

Check that it’s running:

```bash
docker logs quake-server
```

You should see something like: `WebTransport server listening on port 4433`.

---

## 7. Point the game at your server

**Option A – Quick test with the VM’s public IP (certificate warning):**

1. In your **local** Omega_Quake repo, edit **`src/menu.js`** and **`main.js`** and set the server URL to:
   - `https://YOUR_PUBLIC_IP:4433`  
   (replace `YOUR_PUBLIC_IP` with the Oracle VM’s public IP).
2. Push and redeploy the frontend (e.g. Vercel). In the game, try Multiplayer. The browser may show a certificate warning because the server uses a self-signed cert; you may need to accept it (or open the URL in a new tab and accept once).

**Option B – Production with a domain and real TLS (recommended):**

1. **Domain:** In your DNS provider, create an **A** record for a subdomain (e.g. `wt.omeganetwork.co`) pointing to the Oracle VM’s **public IP**.
2. **TLS cert on the VM:** SSH into the VM and install certbot, then get a cert. For a standalone server on 4433 you’ll use a **DNS challenge** (certbot doesn’t need port 80 then):
   ```bash
   sudo apt-get install -y certbot
   sudo certbot certonly --standalone -d wt.omeganetwork.co --preferred-challenges http
   ```
   This requires port 80 to be free and open temporarily. If you prefer not to stop the game server, use the **DNS challenge** instead (e.g. `certbot certonly --manual --preferred-challenges dns -d wt.omeganetwork.co`) and follow the prompts to add a TXT record.
3. **Run the server with the real cert:** Stop the current container, then run with the cert paths:
   ```bash
   docker stop quake-server
   docker rm quake-server
   docker run -d --name quake-server --restart unless-stopped -p 4433:4433/udp -e PORT=4433 \
     -v /etc/letsencrypt/live/wt.omeganetwork.co/fullchain.pem:/app/server/cert.pem:ro \
     -v /etc/letsencrypt/live/wt.omeganetwork.co/privkey.pem:/app/server/key.pem:ro \
     omega-quake-server
   ```
   (Replace `wt.omeganetwork.co` with your subdomain.)
4. In **`src/menu.js`** and **`main.js`**, set the server URL to:
   - `https://wt.omeganetwork.co:4433`
5. Push and redeploy the frontend. Multiplayer should work without certificate warnings.

---

## 8. Open UDP 4433 on the VM (optional but recommended)

Oracle’s Security List already allows UDP 4433. If the VM has a local firewall (e.g. UFW), allow the port:

```bash
sudo ufw allow 4433/udp
sudo ufw status
```

Enable UFW only if you’re sure you won’t lock yourself out (SSH is usually allowed by default).

---

## Useful commands

| Task | Command |
|------|--------|
| View server logs | `docker logs -f quake-server` |
| Stop server | `docker stop quake-server` |
| Start again | `docker start quake-server` |
| Rebuild after a code change | `cd ~/Omega_Quake && git pull && docker build -f Dockerfile.server -t omega-quake-server . && docker stop quake-server && docker rm quake-server && docker run -d --name quake-server --restart unless-stopped -p 4433:4433/udp -e PORT=4433 omega-quake-server` |

---

## Summary

1. Oracle Cloud: sign up (Always Free), create Ubuntu VM, note public IP.  
2. Security List: add ingress rule **UDP, port 4433**, source `0.0.0.0/0`.  
3. SSH: install Docker, clone **Omega_Quake**, build **Dockerfile.server**, run container with **`-p 4433:4433/udp`**.  
4. Game: set **`DEFAULT_WT_SERVER`** in **`src/menu.js`** and **`main.js`** to `https://YOUR_IP:4433` (test) or `https://wt.omeganetwork.co:4433` (with domain + Let’s Encrypt), then redeploy the frontend.

After that, multiplayer uses your Oracle server.
