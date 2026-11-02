/**
 * Credential and role changes require a full admin.
 * Developers may use the admin panel (test runner, reads) but not these mutations.
 */
function requireAdminActor(req, res) {
    if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'Forbidden: Admin access required.' });
        return false;
    }
    return true;
}

function auditAdminAction(req, action, targetId) {
    console.log(JSON.stringify({
        audit: 'admin',
        action,
        actorId: req.userId,
        targetId,
        at: new Date().toISOString(),
    }));
}

module.exports = { requireAdminActor, auditAdminAction };
