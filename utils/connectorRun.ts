import type { Bot, ConnectorDimensionKey, ConnectorEndType, ConnectorVignettePublic, Message } from '../types';

export const CONNECTOR_PERSONA_BOT_ID = 'connector-persona';

/** Frontend avatar mapping for connector personas (assets in public/avatars/). */
export const CONNECTOR_AVATARS: Record<string, string> = {
    'jonas-meeting': '/avatars/connector-jonas.png',
    'leila-breakup': '/avatars/connector-leila.png',
    'tom-vancouver': '/avatars/connector-tom.png',
    'carmen-mia': '/avatars/connector-carmen.png',
    'david-exhaustion': '/avatars/connector-david.png',
    'sophie-repair': '/avatars/connector-sophie.png',
    'marc-promotion': '/avatars/connector-marc.png',
    'nina-review': '/avatars/connector-nina.png',
};

export type ConnectorRunMode = 'assessment' | 'practice' | 'open';

export const CONNECTOR_OPEN_SITUATION_CONSENT_KEY = 'connector_open_situation_consent_v1';

export const CONNECTOR_OPEN_LIMITS = {
    relationshipMax: 120,
    situationMax: 800,
} as const;

export interface ConnectorRunState {
    mode: ConnectorRunMode;
    vignettes: ConnectorVignettePublic[];
    currentIndex: number;
    entries: { vignetteId: string; history: Message[]; endType: ConnectorEndType }[];
    liveMode: boolean;
    practiceFocus?: ConnectorDimensionKey;
    customScenarioId?: string;
    maxUserTurns?: number;
    lengthPreset?: string;
    relationshipBucket?: string;
}

export interface ConnectorChatConfig {
    vignetteId: string;
    personaName: string;
    personaGender: 'male' | 'female';
    liveMode: boolean;
    scenarioBrief: string;
    runMode: ConnectorRunMode;
    customScenarioId?: string;
    maxUserTurns?: number;
}

export function botFromConnectorVignette(vignette: ConnectorVignettePublic): Bot {
    return {
        id: CONNECTOR_PERSONA_BOT_ID,
        name: vignette.personaName,
        description: vignette.relationship,
        description_de: vignette.relationship,
        avatar: vignette.id.startsWith('custom-') ? '/avatars/nobody.png' : (CONNECTOR_AVATARS[vignette.id] || '/avatars/nobody.png'),
        style: 'The Connector',
        style_de: 'The Connector',
        accessTier: 'registered',
    };
}

export function openingMessageFromVignette(vignette: ConnectorVignettePublic): Message {
    return {
        id: `bot-connector-${vignette.id}-${Date.now()}`,
        role: 'bot',
        text: vignette.opening,
        timestamp: new Date().toISOString(),
    };
}
