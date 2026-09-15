# Liquidity backend — Oracle Cloud Always Free deployment

This backend is FastAPI + FFmpeg + faster-whisper. It writes uploaded videos, extracted audio,
project JSON, subtitle files and exports to the local `storage/` tree.

## Why `storage/` is not in the ZIP

`app/core/config.py` calls `ensure_directories()` and automatically creates:

- `storage/uploads`
- `storage/audio`
- `storage/projects`
- `storage/subtitles`
- `storage/exports`

The deploy script also creates them explicitly. Do **not** commit generated storage to Git.

## 1. Create the Oracle VM

Use an Always Free Ubuntu ARM/Ampere A1 VM in your home region. Allocate the free capacity
available to your account (ideally 2 OCPU / 12 GB RAM) and a sufficiently large boot volume.
Open inbound TCP 22, 80 and 443 in the Oracle VCN/security rules.

## 2. Put this backend on the VM

Recommended: push this sanitized package to a private GitHub repository, then on the VM:

```bash
git clone YOUR_PRIVATE_REPO_URL liquidity-backend
cd liquidity-backend
cp .env.example .env
nano .env
```

Set at least:

```env
APP_ENV=production
FRONTEND_ORIGIN=https://YOUR-FRONTEND.vercel.app
OPENAI_API_KEY=YOUR_REAL_OPENAI_API_KEY
WHISPER_MODEL=large-v3-turbo
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
```

Never commit `.env`.

## 3. Install and run as a service

```bash
chmod +x deploy/oracle/install-backend.sh
./deploy/oracle/install-backend.sh "$(pwd)"
```

If the script created `.env` and stopped, edit the file and run the script again.

Check:

```bash
curl http://127.0.0.1:8000/health
sudo journalctl -u liquidity-backend -f
```

The first Whisper job may take longer because the model must be downloaded and cached.

## 4. Give the API a stable HTTPS hostname

Create a DNS A record such as `api.example.com` pointing to the Oracle VM public IPv4.
Then install the supplied Nginx template:

```bash
sudo cp deploy/oracle/nginx-liquidity.conf.template /etc/nginx/sites-available/liquidity
sudo nano /etc/nginx/sites-available/liquidity
# Replace YOUR_BACKEND_DOMAIN
sudo ln -sf /etc/nginx/sites-available/liquidity /etc/nginx/sites-enabled/liquidity
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.example.com
```

Verify:

```bash
curl https://api.example.com/health
curl https://api.example.com/cors-debug
```

## 5. Point the Vercel frontend to the backend

In Vercel project settings -> Environment Variables, set:

```env
VITE_API_URL=https://api.example.com/api
```

Apply it to Production (and Preview if wanted), then redeploy the frontend. Vite environment
variables are compiled into the frontend at build time, so a redeploy is required.

Also keep backend:

```env
FRONTEND_ORIGIN=https://YOUR-FRONTEND.vercel.app
```

Restart after changing backend `.env`:

```bash
sudo systemctl restart liquidity-backend
```

## 6. Useful checks

Backend health:

```bash
curl https://api.example.com/health
```

CORS config:

```bash
curl https://api.example.com/cors-debug
```

Service logs:

```bash
sudo journalctl -u liquidity-backend -n 200 --no-pager
```

Disk usage:

```bash
df -h
du -sh storage ~/.cache/huggingface 2>/dev/null || true
```

## Important operational note

The current application stores project state in JSON files and runs processing as a FastAPI
background task. A single persistent VM is therefore a much better fit than a free serverless
platform with ephemeral disk. Do not use the current architecture on a host that deletes local
files on sleep/redeploy unless storage/project-state handling is redesigned first.
