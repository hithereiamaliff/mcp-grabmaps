# Firebase Analytics Setup Guide

This MCP server uses Firebase Realtime Database for cloud-based analytics storage with local file backup as fallback.

## Prerequisites

- Firebase project created
- Firebase Realtime Database enabled
- Service account credentials downloaded

## Setup Instructions

### 1. On Your VPS

Create the credentials directory and copy your Firebase service account JSON file:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to the project directory
cd /opt/mcp-servers/grabmaps

# Create credentials directory
mkdir -p .credentials

# Copy your Firebase service account JSON file to the VPS
# Option 1: Use scp from your local machine
scp /path/to/firebase-service-account.json root@your-vps-ip:/opt/mcp-servers/grabmaps/.credentials/

# Option 2: Create and paste the content manually
nano .credentials/firebase-service-account.json
# Paste the JSON content, save and exit (Ctrl+X, Y, Enter)

# Set proper permissions
chmod 600 .credentials/firebase-service-account.json
```

### 2. Copy Credentials to Docker Volume

```bash
# Create the Docker volume if it doesn't exist
docker volume create grabmaps_firebase-credentials

# Copy credentials to the volume
docker run --rm \
  -v grabmaps_firebase-credentials:/credentials \
  -v $(pwd)/.credentials:/source:ro \
  alpine cp /source/firebase-service-account.json /credentials/

# Fix permissions (container runs as UID 1001)
docker run --rm \
  -v grabmaps_firebase-credentials:/credentials \
  alpine chown -R 1001:1001 /credentials/
```

### 3. Rebuild and Restart Container

```bash
cd /opt/mcp-servers/grabmaps
docker compose down
docker compose up -d --build
docker compose logs -f
```

## Verification

Check the logs to confirm Firebase initialization:

```bash
docker logs mcp-grabmaps | grep Firebase
```

You should see:
```
🔥 Firebase Analytics initialized successfully
📊 Loaded analytics from Firebase
```

If Firebase credentials are not found, the server will fall back to local file storage:
```
⚠️ Firebase credentials not found, analytics will use local storage only
```

## Firebase Realtime Database Structure

Analytics are stored at:
```
mcp-analytics/
  └── mcp-grabmaps/
      ├── serverStartTime: "2026-01-06T..."
      ├── totalRequests: 123
      ├── totalToolCalls: 45
      ├── requestsByMethod: {...}
      ├── requestsByEndpoint: {...}
      ├── toolCalls: {...}
      ├── recentToolCalls: [...]
      ├── clientsByIp: {...}
      ├── clientsByUserAgent: {...}
      ├── hourlyRequests: {...}
      ├── lastUpdated: 1704470400000
      └── _timestamp: "2026-01-06T..."
```

## Dual Storage

The server uses a dual-storage approach:

1. **Primary**: Firebase Realtime Database (cloud-based, persistent across deployments)
2. **Backup**: Local file `/app/data/analytics.json` (container-local, survives restarts)

### Data Flow

- **On startup**: Load from Firebase first, fallback to local file if Firebase unavailable
- **During operation**: Save to both Firebase and local file every 60 seconds
- **On shutdown**: Save to both Firebase and local file

## Troubleshooting

### Firebase not initializing

```bash
# Check if credentials file exists in volume
docker run --rm -v grabmaps_firebase-credentials:/credentials alpine ls -la /credentials/

# Check container logs for errors
docker logs mcp-grabmaps | grep -i error
```

### Credentials file not found

```bash
# Verify the file is in the correct location on VPS
ls -la /opt/mcp-servers/grabmaps/.credentials/

# Re-copy to Docker volume
docker run --rm \
  -v grabmaps_firebase-credentials:/credentials \
  -v /opt/mcp-servers/grabmaps/.credentials:/source:ro \
  alpine cp /source/firebase-service-account.json /credentials/
```

### Permission denied

```bash
# Fix permissions on VPS
chmod 600 /opt/mcp-servers/grabmaps/.credentials/firebase-service-account.json

# Fix permissions in Docker volume
docker run --rm \
  -v grabmaps_firebase-credentials:/credentials \
  alpine chown -R 1001:1001 /credentials/

# Rebuild container
docker compose down
docker compose up -d --build
```

## Security Notes

- ⚠️ **Never commit** the `firebase-service-account.json` file to Git
- ✅ The `.credentials/` directory is in `.gitignore`
- ✅ The Docker volume is mounted as read-only (`:ro`)
- ✅ Credentials are only accessible inside the container

## Viewing Analytics

- **Dashboard**: `https://mcp.techmavie.digital/grabmaps/analytics/dashboard`
- **JSON API**: `https://mcp.techmavie.digital/grabmaps/analytics`
- **Firebase Console**: https://console.firebase.google.com/ → Your Project → Realtime Database

---

**Last Updated**: January 6, 2026
