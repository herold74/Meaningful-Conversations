# Blue-Green Deployment Testing Guide

This guide provides comprehensive testing procedures for the Zero-Downtime Blue-Green Deployment system.

## Prerequisites

- Node.js and npm installed
- Backend and frontend can run locally
- jq installed (`brew install jq`)
- curl installed
- Two terminal windows available

## Local Testing

### Test 1: JWT Deployment Version Tracking

#### Objective
Verify that JWT tokens include deployment version information.

#### Steps

1. **Start Backend with Version 1.6.7**:
```bash
cd meaningful-conversations-backend
VERSION=1.6.7 npm run dev
```

2. **Start Frontend (Port 5173)**:
```bash
# In new terminal
cd /Users/gherold/Meaningful-Conversations-Project
npm run dev
```

3. **Login and Inspect Token**:
- Open browser to `http://localhost:5173`
- Login with test account
- Open Developer Tools → Application → Local Storage
- Find `token` key
- Decode JWT at https://jwt.io
- **Verify**: Token payload contains `deploymentVersion: "1.6.7"`

4. **Update Backend Version**:
```bash
# Stop backend (Ctrl+C)
VERSION=1.6.8 npm run dev
```

5. **Login with New Account**:
- Use different email or incognito window
- Login and decode new token
- **Verify**: Token payload contains `deploymentVersion: "1.6.8"`

6. **Check Old Token Still Works**:
- Go back to first browser window (with 1.6.7 token)
- Navigate to different pages
- **Verify**: Application works normally with old token

#### Expected Results
- ✓ JWT tokens include `deploymentVersion` field
- ✓ Version matches `process.env.VERSION` at token creation time
- ✓ Old tokens continue to work after version change
- ✓ New logins get new version number

---

### Test 2: Session Endpoint Functionality

#### Objective
Verify that the `/api/deployment/active-sessions` endpoint correctly identifies users on different versions.

#### Steps

1. **Start Backend**:
```bash
cd meaningful-conversations-backend
VERSION=1.6.8 npm run dev
```

2. **Create Old Version Users**:
```bash
# Temporarily set VERSION to 1.6.7
VERSION=1.6.7 npm run dev
```

- Login with User A (gets version 1.6.7 token)
- Note the login time

3. **Create New Version Users**:
```bash
# Restart with VERSION=1.6.8
VERSION=1.6.8 npm run dev
```

- Login with User B (gets version 1.6.8 token)

4. **Query Session Endpoint**:
```bash
curl http://localhost:3001/api/deployment/active-sessions | jq
```

#### Expected Response
```json
{
  "totalActiveUsers": 2,
  "oldVersionSessions": 1,
  "currentVersion": "1.6.8",
  "deploymentTime": "2025-01-15T10:30:00.000Z",
  "users": [
    {
      "email": "user-a@example.com",
      "lastActivity": "2025-01-15T10:25:00.000Z"
    }
  ]
}
```

#### Expected Results
- ✓ Endpoint returns session count
- ✓ Old version sessions correctly identified
- ✓ User details provided for old sessions
- ✓ Current version reported accurately

---

### Test 3: Dual Frontend Instance

#### Objective
Run two frontend instances simultaneously and verify routing behavior.

#### Setup

1. **Terminal 1 - Backend**:
```bash
cd meaningful-conversations-backend
VERSION=1.6.8 npm run dev
```

2. **Terminal 2 - Frontend Blue (Port 5173)**:
```bash
cd /Users/gherold/Meaningful-Conversations-Project
npm run dev
```

3. **Terminal 3 - Frontend Green (Port 5174)**:
```bash
cd /Users/gherold/Meaningful-Conversations-Project
VITE_PORT=5174 npm run dev
```

#### Test Scenarios

**Scenario A: User on Blue Stays on Blue**

1. Open `http://localhost:5173` (Blue)
2. Login as User A
3. Interact with application
4. Verify all requests go to Blue
5. Check JWT token has `deploymentVersion: "1.6.8"`

**Scenario B: New User Goes to Green**

1. Open `http://localhost:5174` (Green) in incognito
2. Login as User B
3. Interact with application
4. Verify all requests go to Green
5. Check JWT token has `deploymentVersion: "1.6.8"`

**Scenario C: Session Persistence**

1. Keep both Blue and Green instances running
2. In Blue browser: Navigate between pages
3. In Green browser: Navigate between pages
4. **Verify**: Each user stays on their respective frontend
5. **Verify**: Both can access backend API successfully

#### Expected Results
- ✓ Both frontends can run simultaneously
- ✓ Both frontends can access the same backend
- ✓ Users maintain session on their respective frontend
- ✓ No cross-contamination of state

---

### Test 4: Session Monitoring Dashboard

#### Objective
Verify the monitoring dashboard displays accurate real-time data.

#### Steps

1. **Setup Test Environment**:
- Follow Test 3 setup (dual frontend)
- Login as 2 users on Blue
- Login as 1 user on Green

2. **Run Monitor**:
```bash
# Note: This requires SSH access to production server
# For local testing, modify monitor-deployment.sh to use localhost:3001

./monitor-deployment.sh
```

#### Expected Display
```
╔═══════════════════════════════════════════════════════╗
║  Blue-Green Deployment Monitor                        ║
╠═══════════════════════════════════════════════════════╣
║ Current Version: 1.6.8
║ Deployment Time: 2025-01-15T10:30:00.000Z
║ Last Updated:    2025-01-15 11:45:23
╚═══════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Container Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Blue (Old):  ● Running on port 80
  Green (New): ● Running on port 8083

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Active Users:   3

  Blue Container:  2 sessions
                   ██

  Green Container: 1 sessions
                   █
```

#### Expected Results
- ✓ Dashboard refreshes every 10 seconds
- ✓ Session counts are accurate
- ✓ Container status correctly displayed
- ✓ Progress bar shows migration status
- ✓ User details shown for Blue sessions

---

## Production Testing (Staging)

### Test 5: End-to-End Deployment on Staging

#### Objective
Perform a complete blue-green deployment to staging environment.

#### Prerequisites
- Staging backend running and accessible
- Access to staging server: `ssh root@91.99.193.87`
- Latest code committed to main branch

#### Steps

1. **Pre-Deployment Check**:
```bash
# Check current version
ssh root@91.99.193.87 "cd /opt/manualmode-staging && podman ps | grep frontend"

# Check active users
curl https://mc-beta.manualmode.at/api/deployment/active-sessions | jq
```

2. **Run Blue-Green Deployment**:
```bash
./deploy-blue-green.sh \
  --env staging \
  --component frontend \
  --interval 30
```

3. **Monitor Deployment**:
- Watch console output for:
  - ✓ Build completion
  - ✓ Image push to registry
  - ✓ Green container start
  - ✓ Health check pass
  - ✓ Nginx update confirmation

4. **Verify Green Container**:
```bash
# Check containers
ssh root@91.99.193.87 "podman ps | grep frontend"

# Test Blue (should still work)
curl -I https://mc-beta.manualmode.at

# Test Green directly
ssh root@91.99.193.87 "curl -I http://localhost:8083"
```

5. **Simulate User Migration**:
- Open staging site in normal browser (should hit Green)
- Open in incognito with old session token (should hit Blue)
- Monitor session counts:
```bash
./monitor-deployment.sh
```

6. **Wait for Zero Sessions on Blue**:
- Monitor output shows: "No active sessions on Blue"
- Script prompts: "Stop Blue container now? [y/N]"

7. **Complete Deployment**:
- Type 'y' to approve shutdown
- Watch Blue container removal
- Verify all traffic now on Green

#### Expected Results
- ✓ Zero downtime (site always accessible)
- ✓ Users on Blue stay on Blue until they close session
- ✓ New users automatically go to Green
- ✓ Old container safely removed when sessions reach zero
- ✓ Nginx correctly routes traffic throughout process

---

### Test 6: Rollback Procedure

#### Objective
Verify that rollback works if Green has issues.

#### Steps

1. **Simulate Issue with Green**:
```bash
# Stop Green container manually
ssh root@91.99.193.87 "podman stop meaningful-conversations-frontend-green"
```

2. **Verify Blue Still Serves Traffic**:
```bash
curl -I https://mc-beta.manualmode.at
```

3. **Execute Rollback**:
```bash
ssh root@91.99.193.87 "/usr/local/bin/update-nginx-blue-green.sh disable-green"
```

4. **Verify All Traffic on Blue**:
- Check Nginx routing configuration
- Test site access
- Verify all users can access application

#### Expected Results
- ✓ Site remains accessible even if Green fails
- ✓ Traffic can be quickly routed back to Blue
- ✓ No data loss or corruption
- ✓ Clear error messages if something goes wrong

---

## Automated Testing Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] Backend running with correct VERSION env var
- [ ] JWT tokens include deploymentVersion field
- [ ] Session endpoint returns accurate data
- [ ] No critical bugs in new version

### During Deployment
- [ ] Blue container remains running
- [ ] Green container starts successfully
- [ ] Green passes health checks
- [ ] Nginx routing updated
- [ ] New users route to Green
- [ ] Existing users stay on Blue

### Post-Deployment
- [ ] All users eventually migrate to Green
- [ ] Old version sessions reach zero
- [ ] Blue container safely removed
- [ ] Only Green container remains
- [ ] Site fully functional
- [ ] No error logs

### Rollback Test
- [ ] Can quickly disable Green routing
- [ ] Blue continues to serve traffic
- [ ] Clear rollback procedure documented

---

## Common Issues and Solutions

### Issue: Session count never reaches zero

**Cause**: Users with long-lived sessions or automated tools

**Solution**:
- Check user list to identify accounts
- Contact users if necessary
- Set reasonable timeout (e.g., force shutdown after 2 hours)

### Issue: Green container fails health check

**Cause**: Application error, missing env vars, or port conflict

**Solution**:
- Check container logs: `podman logs meaningful-conversations-frontend-green`
- Verify environment variables are set correctly
- Ensure port 8083 is not in use
- Rollback to Blue if can't resolve quickly

### Issue: Both containers show same version

**Cause**: CURRENT_VERSION not set correctly

**Solution**:
```bash
# Explicitly set versions when starting
export CURRENT_VERSION=1.6.7
export VERSION=1.6.8
podman-compose up -d
```

### Issue: Monitor shows "?" for session counts

**Cause**: jq not installed or API endpoint not responding

**Solution**:
```bash
# Install jq
brew install jq  # macOS
apt-get install jq  # Ubuntu

# Test API directly
curl http://localhost:8082/api/deployment/active-sessions
```

---

## Performance Benchmarks

Expected performance during blue-green deployment:

- **Deployment Time**: 5-10 minutes (build + push + start)
- **Downtime**: 0 seconds (seamless transition)
- **Session Migration**: Natural (as users close/reopen browsers)
- **Resource Overhead**: +512MB RAM, +0.5 CPU during dual-container phase
- **Rollback Time**: < 30 seconds (if needed)

---

## Next Steps

After successful testing:

1. Update Memory Bank with deployment learnings
2. Document any issues encountered
3. Refine scripts based on real-world usage
4. Consider automating monitoring alerts
5. Plan first production blue-green deployment

---

## Support

For issues or questions:
- Check logs: `podman logs <container-name>`
- Review Nginx logs: `/var/log/nginx/error.log`
- Monitor sessions: `./monitor-deployment.sh`
- Contact deployment team

