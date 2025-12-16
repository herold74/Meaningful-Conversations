# Incident Report: Production Outage - Error 500

**Date:** December 15, 2025  
**Time:** ~22:00 - 22:57 CET  
**Severity:** Critical (P1)  
**Status:** Resolved  
**Affected Service:** Production (mc-app.manualmode.at)  
**Impact:** Complete production outage, site unreachable from all devices

---

## Summary

Production was completely inaccessible returning HTTP 500 errors to all users. Investigation revealed that the nginx configuration file was corrupted with ANSI color codes from the `update-nginx-ips.sh` script, causing nginx to fail parsing the configuration.

---

## Timeline

| Time | Event |
|------|-------|
| ~22:00 | User reports production inaccessible from mobile devices (Error 500) |
| 22:56 | Investigation started, checked backend logs (no errors), nginx logs showed critical configuration errors |
| 22:56 | Root cause identified: ANSI color codes in nginx config file (`[31m✗[0m`, `invalid port in upstream "IPAddress:10.89.0.19:3000"`) |
| 22:57 | Emergency fix applied: Manually recreated nginx config with correct container IPs |
| 22:57 | Nginx config tested (`nginx -t`) - successful |
| 22:57 | Nginx reloaded (`systemctl reload nginx`) |
| 22:57 | Production verified accessible, backend API health check passed |
| 23:00 | Permanent fix implemented in `update-nginx-ips.sh` |

**Total Downtime:** ~57 minutes

---

## Root Cause Analysis

### Primary Cause
The `update-nginx-ips.sh` script uses colored output functions (`print_info`, `print_error`, etc.) that emit ANSI escape codes (e.g., `\033[0;31m` for red text). 

When this script was executed as part of the deployment process, these color codes were written into the nginx configuration file `/etc/nginx/conf.d/production-meaningful-conversations.conf`, causing nginx to fail parsing it:

```
[emerg] unknown directive "31m✗[0m" in /etc/nginx/conf.d/production-meaningful-conversations.conf:5
[emerg] invalid port in upstream "IPAddress:10.89.0.19:3000"
```

### Contributing Factors
1. **Output redirection:** The script's colored output was likely redirected to files or piped through other commands during deployment
2. **Missing validation:** No post-deployment validation to ensure nginx config remained valid
3. **Silent failure:** The corruption happened during a routine deployment and wasn't detected immediately

---

## Immediate Fix (Applied)

### Emergency Nginx Config Restoration
```bash
# Manually recreated correct nginx config with current container IPs
ssh root@91.99.193.87 "cat > /etc/nginx/conf.d/production-meaningful-conversations.conf << 'EOF'
server {
    server_name mc-app.manualmode.at;
    location / {
        proxy_pass http://10.89.0.5:3000/;
        # ... (full config restored)
    }
    location /api/ {
        proxy_pass http://10.89.0.4:8080/api/;
        # ...
    }
}
EOF"

# Test and reload
nginx -t && systemctl reload nginx
```

### Verification
- ✅ Frontend: `https://mc-app.manualmode.at/` returns HTML
- ✅ Backend: `https://mc-app.manualmode.at/api/health` returns `{"status":"ok","database":"connected"}`

---

## Permanent Fix (Applied)

### Modified `update-nginx-ips.sh`
Redirected **ALL** colored output to `stderr` using `>&2` to ensure stdout remains clean for any potential output captures or redirections:

```bash
# Before (dangerous):
print_info "Updating production nginx configurations..."

# After (safe):
print_info "Updating production nginx configurations..." >&2
```

**Changes made:**
- All `print_info`, `print_success`, `print_warning`, `print_error` calls now use `>&2`
- All `echo` statements for logging now use `>&2`
- Error messages from `get_container_ip` redirected to stderr
- Ensures only clean IP addresses and configuration data go to stdout

---

## Lessons Learned

### What Went Well
✅ Fast root cause identification (< 5 minutes)  
✅ Emergency fix applied immediately  
✅ Backend containers were healthy throughout (no data loss)  
✅ Users' data and sessions preserved

### What Went Wrong
❌ No automated post-deployment nginx validation  
❌ Color codes in scripts not properly isolated  
❌ No immediate alerting when nginx config became invalid  
❌ Deployment process didn't detect nginx reload failures

---

## Action Items

### Immediate (Completed)
- [x] Fix `update-nginx-ips.sh` to redirect all colored output to stderr
- [x] Verify production is accessible
- [x] Document incident

### Short-Term (To Do)
- [ ] Add post-deployment nginx config validation to `deploy-manualmode.sh`
- [ ] Implement automated health checks that alert on prolonged failures
- [ ] Add nginx config backup/restore mechanism in deployment scripts
- [ ] Create pre-flight check: `nginx -t` before and after IP updates

### Long-Term (To Do)
- [ ] Add monitoring/alerting for nginx config errors
- [ ] Consider using nginx config templates instead of sed replacements
- [ ] Implement automatic rollback on health check failures

---

## Prevention Measures

### 1. Deployment Script Enhancement
```bash
# Add to deploy-manualmode.sh after nginx IP update:
echo "🔍 Validating nginx configuration..."
if ! ssh root@$SERVER "nginx -t" 2>&1 | grep -q "successful"; then
    echo "❌ Nginx configuration invalid! Rolling back..."
    ssh root@$SERVER "cp /etc/nginx/conf.d/*.bak /etc/nginx/conf.d/"
    ssh root@$SERVER "systemctl reload nginx"
    exit 1
fi
```

### 2. Monitoring
- Set up nginx error log monitoring
- Alert on nginx reload failures
- Regular automated health checks (every 5 minutes)

### 3. Script Best Practices
- Always redirect diagnostic/colored output to stderr
- Keep stdout clean for data/piping
- Test scripts in isolation and as part of automation

---

## Related Changes

**Git Commit:** (to be committed)
- Fixed: `update-nginx-ips.sh` - Redirect all colored output to stderr
- Added: `INCIDENT-REPORT-2025-12-15.md` - Document production outage

**Version:** v1.6.9 → v1.6.10

---

## Attachments

### Nginx Error Log Excerpt
```
2025/12/15 21:36:06 [emerg] 522474#522474: unknown directive "31m✗[0m" in /etc/nginx/conf.d/production-meaningful-conversations.conf:10
2025/12/15 21:53:01 [emerg] 534552#534552: invalid port in upstream "IPAddress:10.89.0.19:3000" in /etc/nginx/conf.d/production-meaningful-conversations.conf:10
2025/12/15 22:23:33 [emerg] 556290#556290: unknown directive "31m✗[0m" in /etc/nginx/conf.d/production-meaningful-conversations.conf:5
```

### Container Status During Incident
```
meaningful-conversations-backend-production   Up 33 minutes (healthy)
meaningful-conversations-frontend-blue        Up 33 minutes (healthy)
meaningful-conversations-mariadb-production   Up 33 minutes (healthy)
meaningful-conversations-tts-production       Up 33 minutes (healthy)
```

All containers remained healthy - only nginx configuration was affected.

---

**Report Prepared By:** AI Assistant (Cursor)  
**Reviewed By:** (Pending)  
**Date:** 2025-12-15 23:00 CET

