const prisma = require('../prismaClient.js');
const {
  PRACTICE_USER_SELECT,
  isPremiumActive,
  isStaffOrClient,
} = require('../utils/practiceAccess.js');

function connectorPremiumErrorMessage(language = 'de') {
  return language === 'en'
    ? 'Connector practice and custom situations require an active Premium subscription.'
    : 'Connector-Übung und eigene Situationen erfordern ein aktives Premium-Abo.';
}

/**
 * @returns {Promise<{ ok: true, user: object } | { ok: false, status: number, error: string, errorCode?: string }>}
 */
async function requireConnectorPremium(userId, language = 'de') {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PRACTICE_USER_SELECT,
  });
  if (!user) {
    return { ok: false, status: 404, error: 'User not found.' };
  }
  if (!isStaffOrClient(user) && !isPremiumActive(user)) {
    return {
      ok: false,
      status: 403,
      error: connectorPremiumErrorMessage(language),
      errorCode: 'CONNECTOR_PREMIUM_REQUIRED',
    };
  }
  return { ok: true, user };
}

module.exports = {
  requireConnectorPremium,
  connectorPremiumErrorMessage,
};
