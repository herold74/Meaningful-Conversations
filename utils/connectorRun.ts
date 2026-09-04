import type { Bot, ConnectorEndType, ConnectorVignettePublic, Message } from '../types';

export const CONNECTOR_PERSONA_BOT_ID = 'connector-persona';

/** Frontend avatar mapping for connector personas (assets in public/avatars/). */
export const CONNECTOR_AVATARS: Record<string, string> = {
    'jonas-meeting': '/avatars/connector-jonas.png',
    'leila-breakup': '/avatars/connector-leila.png',
    'tom-vancouver': '/avatars/connector-tom.png',
    'carmen-mia': '/avatars/connector-carmen.png',
    'david-exhaustion': '/avatars/connector-david.png',
};

export interface ConnectorRunState {
    vignettes: ConnectorVignettePublic[];
    currentIndex: number;
    entries: { vignetteId: string; history: Message[]; endType: ConnectorEndType }[];
    liveMode: boolean;
}

export interface ConnectorChatConfig {
    vignetteId: string;
    personaName: string;
    personaGender: 'male' | 'female';
    liveMode: boolean;
}

export function botFromConnectorVignette(vignette: ConnectorVignettePublic): Bot {
    return {
        id: CONNECTOR_PERSONA_BOT_ID,
        name: vignette.personaName,
        description: vignette.relationship,
        description_de: vignette.relationship,
        avatar: CONNECTOR_AVATARS[vignette.id] || '/avatars/nobody.png',
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
