const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient.js');
const authMiddleware = require('../middleware/auth.js');

/**
 * POST /api/personality/save
 * Speichert verschluesseltes Persoenlichkeitsprofil
 */
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { testType, filterWorry, filterControl, encryptedData } = req.body;
    const userId = req.userId;
    
    // Validation
    if (!testType || !encryptedData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Upsert (create or update)
    const profile = await prisma.personalityProfile.upsert({
      where: { userId },
      create: {
        userId,
        testType,
        filterWorry: filterWorry || 0,
        filterControl: filterControl || 0,
        encryptedData,
        sessionCount: 0
      },
      update: {
        testType,
        filterWorry: filterWorry || 0,
        filterControl: filterControl || 0,
        encryptedData,
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, profileId: profile.id });
  } catch (error) {
    console.error('Error saving personality profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

/**
 * GET /api/personality/profile
 * Holt verschluesseltes Profil (Client muss entschluesseln)
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await prisma.personalityProfile.findUnique({
      where: { userId: req.userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/personality/session-log
 * Loggt Session-Verhalten mit verschluesseltem Transkript
 */
router.post('/session-log', authMiddleware, async (req, res) => {
  try {
    const { sessionId, encryptedTranscript, frequencies } = req.body;
    
    if (!sessionId || !encryptedTranscript) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const log = await prisma.sessionBehaviorLog.create({
      data: {
        userId: req.userId,
        sessionId,
        encryptedTranscript,
        dauerFrequency: frequencies?.dauer || 0,
        wechselFrequency: frequencies?.wechsel || 0,
        naeheFrequency: frequencies?.naehe || 0,
        distanzFrequency: frequencies?.distanz || 0
      }
    });
    
    res.json({ success: true, logId: log.id });
  } catch (error) {
    console.error('Error logging session:', error);
    res.status(500).json({ error: 'Failed to log session' });
  }
});

/**
 * POST /api/personality/comfort-check
 * Speichert Comfort Score fuer eine Session
 */
router.post('/comfort-check', authMiddleware, async (req, res) => {
  try {
    const { sessionId, score, optOut } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    
    const updated = await prisma.sessionBehaviorLog.updateMany({
      where: {
        userId: req.userId,
        sessionId
      },
      data: {
        comfortScore: score,
        optedOut: optOut || false
      }
    });
    
    res.json({ success: true, updated: updated.count });
  } catch (error) {
    console.error('Error saving comfort check:', error);
    res.status(500).json({ error: 'Failed to save comfort check' });
  }
});

/**
 * GET /api/personality/adaptation-suggestions
 * Berechnet Profil-Update-Vorschlaege basierend auf Session-Logs
 */
router.get('/adaptation-suggestions', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Hole die letzten 5 Sessions (nicht opted-out)
    const recentLogs = await prisma.sessionBehaviorLog.findMany({
      where: {
        userId,
        optedOut: false,
        comfortScore: { gte: 3 } // Nur authentische Sessions
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (recentLogs.length < 3) {
      return res.json({ 
        hasSuggestions: false, 
        message: 'Not enough data yet (minimum 3 sessions)' 
      });
    }
    
    // Hole aktuelles Profil
    const profile = await prisma.personalityProfile.findUnique({
      where: { userId }
    });
    
    if (!profile || profile.testType !== 'RIEMANN') {
      return res.json({ hasSuggestions: false, message: 'No Riemann profile found' });
    }
    
    // Berechne Durchschnittswerte der Frequenzen
    const avgFrequencies = {
      dauer: Math.round(recentLogs.reduce((sum, log) => sum + log.dauerFrequency, 0) / recentLogs.length),
      wechsel: Math.round(recentLogs.reduce((sum, log) => sum + log.wechselFrequency, 0) / recentLogs.length),
      naehe: Math.round(recentLogs.reduce((sum, log) => sum + log.naeheFrequency, 0) / recentLogs.length),
      distanz: Math.round(recentLogs.reduce((sum, log) => sum + log.distanzFrequency, 0) / recentLogs.length)
    };
    
    // Note: profile.encryptedData ist verschluesselt
    // Der Client muss es entschluesseln und die Deltas berechnen
    res.json({
      hasSuggestions: true,
      observedFrequencies: avgFrequencies,
      sessionCount: recentLogs.length,
      message: 'Client must decrypt profile and calculate deltas'
    });
    
  } catch (error) {
    console.error('Error calculating adaptation suggestions:', error);
    res.status(500).json({ error: 'Failed to calculate suggestions' });
  }
});

module.exports = router;

