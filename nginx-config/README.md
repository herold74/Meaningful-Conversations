# Nginx Blue-Green Deployment Configuration

This directory contains Nginx configuration files for implementing zero-downtime blue-green deployments.

## Files

### `blue-green-routing.conf`
Main Nginx configuration file that implements cookie-based routing for blue-green deployments.

**Installation:**
```bash
# Copy to nginx sites-available
sudo cp blue-green-routing.conf /etc/nginx/sites-available/meaningful-conversations-production.conf

# Enable the site
sudo ln -sf /etc/nginx/sites-available/meaningful-conversations-production.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### `update-nginx-blue-green.sh`
Management script for switching between Blue and Green deployments.

**Installation:**
```bash
# Copy to /usr/local/bin on the production server
scp update-nginx-blue-green.sh root@91.99.193.87:/usr/local/bin/
ssh root@91.99.193.87 "chmod +x /usr/local/bin/update-nginx-blue-green.sh"
```

**Usage:**
```bash
# Enable Green container (new users go to Green, existing stay on Blue)
/usr/local/bin/update-nginx-blue-green.sh enable-green

# Disable Green routing (all users back to Blue)
/usr/local/bin/update-nginx-blue-green.sh disable-green

# Disable Blue routing (all users to Green, Blue can be shut down)
/usr/local/bin/update-nginx-blue-green.sh disable-blue

# Check current routing status
/usr/local/bin/update-nginx-blue-green.sh status
```

## How It Works

### Cookie-Based Session Affinity

1. **Initial Visit**: New users get a `mc_deployment=green` cookie and are routed to Green container
2. **Existing Sessions**: Users with `mc_deployment=blue` cookie stay on Blue container
3. **Migration**: Over time, as users close and reopen their browsers, they naturally migrate to Green

### Routing Logic

```nginx
map $cookie_mc_deployment $upstream_frontend {
    "blue"  frontend_blue;   # Users with blue cookie → Blue container
    default frontend_green;  # Everyone else → Green container
}
```

### Port Mapping

- **Blue Container** (old version): Port 80 → Internal 3000
- **Green Container** (new version): Port 8083 → Internal 3001
- **Backend**: Port 8082 → Internal 8080

## Deployment Flow

1. **Start Green**: `podman-compose up -d frontend-green`
2. **Enable Green Routing**: `update-nginx-blue-green.sh enable-green`
3. **Monitor Sessions**: Watch for users on Blue to reach zero
4. **Shutdown Blue**: When safe, stop Blue container
5. **Promote Green**: Rename Green to Blue for next deployment

## JWT-Based Routing (Future Enhancement)

The current implementation uses cookie-based routing for simplicity. For JWT-based routing that tracks deployment versions in the authentication token, you would need:

1. **Nginx Lua Module**: Install `nginx-module-njs` or `lua-nginx-module`
2. **JWT Decoding**: Extract `deploymentVersion` from JWT token
3. **Version Comparison**: Route based on token version vs current version

Example (requires Lua):
```nginx
location / {
    access_by_lua_block {
        local jwt = require "resty.jwt"
        local token = ngx.var.http_authorization
        
        if token then
            local jwt_obj = jwt:load_jwt(token:match("Bearer%s+(.+)"))
            if jwt_obj.payload.deploymentVersion ~= os.getenv("VERSION") then
                ngx.var.target = "frontend_blue"
            else
                ngx.var.target = "frontend_green"
            end
        end
    }
}
```

## Troubleshooting

### Check Container Status
```bash
podman ps | grep frontend
```

### Test Container Connectivity
```bash
# Blue
curl -I http://localhost:80

# Green
curl -I http://localhost:8083
```

### Check Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Verify Routing Configuration
```bash
cat /etc/nginx/conf.d/deployment-routing.conf
```

## Security Considerations

- All traffic is forced to HTTPS
- Cookies are `HttpOnly`, `Secure`, and `SameSite=Strict`
- Health check endpoint is access-log disabled for performance
- WebSocket support is enabled for real-time features
- Appropriate timeouts configured for API vs static content

