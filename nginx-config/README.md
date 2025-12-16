# Nginx Configuration Templates

This directory contains reference templates for nginx reverse proxy configurations.

## ⚠️ Important Notes

### IPv6 Support is CRITICAL

Both production and staging configs **MUST** include IPv6 listeners:

```nginx
listen 443 ssl http2;
listen [::]:443 ssl http2;  # <- This line is REQUIRED!
```

**Why?** Many networks and browsers prefer IPv6. Without the IPv6 listener, requests may:
- Be routed to the wrong server block (e.g., staging instead of production)
- Serve stale/cached content
- Fail entirely

### Config Management

The nginx configs on the server are **NOT automatically deployed**. They are managed manually on the server at:

- `/etc/nginx/conf.d/production-meaningful-conversations.conf`
- `/etc/nginx/conf.d/staging-meaningful-conversations.conf`

### Automatic IP Updates

The `update-nginx-ips.sh` script automatically updates container IPs in the existing configs. It:
- ✅ Updates `proxy_pass` IP addresses
- ✅ Preserves all other config settings (including IPv6 listeners)
- ✅ Creates backups before making changes
- ❌ Does NOT recreate or overwrite configs from scratch

## 📝 Using These Templates

### When to Use

Use these templates when:
1. Setting up a new server
2. Recreating nginx configs after corruption
3. Verifying current config has all required settings

### Setup Steps

1. Copy template to server:
```bash
scp nginx-config/production-meaningful-conversations.conf.template \
    root@91.99.193.87:/etc/nginx/conf.d/production-meaningful-conversations.conf
```

2. Update placeholder IPs:
```bash
ssh root@91.99.193.87
/usr/local/bin/update-nginx-ips.sh production
```

3. Test and reload:
```bash
nginx -t && systemctl reload nginx
```

## ✅ Verification Checklist

After any nginx config change, verify:

- [ ] Both IPv4 and IPv6 listeners present (`listen 443` and `listen [::]:443`)
- [ ] Frontend proxy_pass points to correct IP:3000
- [ ] Backend proxy_pass points to correct IP:8080
- [ ] SSL certificates are valid
- [ ] nginx -t passes without errors
- [ ] Test both IPv4 and IPv6 access:
  ```bash
  curl -4 https://mc-app.manualmode.at/api/health
  curl -6 https://mc-app.manualmode.at/api/health
  ```

## 🔍 Troubleshooting

### IPv6 Not Working

**Symptoms:**
- Service Worker caching old responses
- 404/500 errors on some networks but not others
- Different behavior on mobile vs desktop

**Fix:**
```bash
# Check if IPv6 listener is present
grep "listen.*\[::\]:443" /etc/nginx/conf.d/production-meaningful-conversations.conf

# If missing, add it:
sed -i '/listen 443 ssl http2;/a\    listen [::]:443 ssl http2;' \
    /etc/nginx/conf.d/production-meaningful-conversations.conf

# Test and reload
nginx -t && systemctl reload nginx
```

## 📚 Related Documentation

- [NGINX-REVERSE-PROXY-SETUP.md](../DOCUMENTATION/NGINX-REVERSE-PROXY-SETUP.md)
- [update-nginx-ips.sh](../update-nginx-ips.sh)
- [deploy-manualmode.sh](../deploy-manualmode.sh)

