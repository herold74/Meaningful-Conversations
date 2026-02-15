import { Bot, Message } from '../types';
import { BOTS } from '../constants';

// ============================================
// Legacy Test Scenario (for backward compatibility)
// ============================================

export interface LegacyTestScenario {
  id: string;
  name: string;
  description: string;
  bot: Bot;
  chatHistory: Message[];
}

// Alias for backward compatibility
export type TestScenario = LegacyTestScenario;

// ============================================
// New Dynamic Test System
// ============================================

export type TestCategory = 'core' | 'session' | 'personality' | 'safety' | 'bot';
export type TestFeature = 'dpc' | 'dpfl' | 'context' | 'formatting' | 'comfort' | 'refinement';

export interface TestMessage {
  text: string;
  expectedBehavior?: string;  // Description of expected AI behavior
}

export interface AutoCheck {
  id: string;
  name: string;
  check: (result: TestRunResult) => boolean;
}

export interface DynamicTestScenario {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  testsFeatures: TestFeature[];
  
  // Test messages to be sent (real API calls!)
  testMessages: TestMessage[];
  
  // Dynamic conversation continuation
  minConversationTurns?: number;  // Minimum number of user-bot exchanges (default: testMessages.length)
  enableDynamicContinuation?: boolean;  // If true, AI generates follow-up messages after predefined ones
  
  // Special test modes
  specialTestMode?: 'refinement_mock';  // Triggers custom test logic (e.g., mock multi-session refinement)
  
  // Automatic validation
  autoChecks: {
    dpcRequired: boolean;
    minDpcLength?: number;
    expectedKeywords?: string[];  // DPFL should detect these
    expectStressKeywords?: boolean;
    // Session analysis auto-checks (for 'session' category)
    expectSessionUpdates?: boolean;  // Expect proposedUpdates.length > 0
    expectSessionNextSteps?: boolean;  // Expect nextSteps.length > 0
  };
  
  // Manual checklist items
  manualChecks: string[];
}

// ============================================
// Profile Building Blocks for Multi-Select
// ============================================

export interface RiemannData {
  naehe: number;
  distanz: number;
  dauer: number;
  wechsel: number;
}

export interface SDLevels {
  beige: number;
  purple: number;
  red: number;
  blue: number;
  orange: number;
  green: number;
  yellow: number;
  turquoise: number;
}

export interface OCEANData {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface RiemannProfileBlock {
  id: string;
  name: string;
  data: RiemannData;
}

export interface SDProfileBlock {
  id: string;
  name: string;
  data: SDLevels;
}

export interface OCEANProfileBlock {
  id: string;
  name: string;
  data: OCEANData;
}

// Combined profile structure for DPC
export interface CombinedTestProfile {
  completedLenses: string[];
  riemann?: { beruf: RiemannData };
  spiralDynamics?: { levels: SDLevels };
  big5?: OCEANData;
}

// Legacy TestProfile interface (kept for backward compatibility)
export interface TestProfile {
  id: string;
  name: string;
  description: string;
  profile: {
    // Must match DPC controller expected structure
    path?: 'RIEMANN' | 'BIG5' | 'SD';
    completedLenses?: string[];
    riemann?: {
      beruf: {
        naehe: number;
        distanz: number;
        dauer: number;
        wechsel: number;
      };
    };
    big5?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    spiralDynamics?: {
      levels: {
        beige?: number;
        purple?: number;
        red?: number;
        blue?: number;
        orange?: number;
        green?: number;
        yellow?: number;
        turquoise?: number;
      };
    };
  };
}

export interface TestRunResult {
  scenarioId: string;
  botId: string;
  profileId: string;
  timestamp: string;
  
  // Response data
  responses: {
    userMessage: string;
    botResponse: string;
    responseTime: number;
    isDynamic?: boolean;  // True if this message was dynamically generated
    llmMetadata?: {
      model: string;
      provider: string;
      tokenUsage: {
        input: number;
        output: number;
        total: number;
      };
      responseTimeMs: number;
      cacheUsed: boolean;
      timestamp: string;
    };
  }[];
  
  // DPC/DPFL telemetry (from backend)
  telemetry?: {
    dpcInjectionPresent: boolean;
    dpcInjectionLength: number;
    dpcStrategiesUsed: string[];
    dpflKeywordsDetected: string[];
    stressKeywordsDetected: boolean;
    dpcMergeMetadata?: any;
    // Phase 2a: Adaptive weighting telemetry
    adaptiveWeighting?: {
      context?: { topic?: string; topicConfidence?: number; linguisticPattern?: string; patternConfidence?: number };
      sentiment?: { polarity?: number; emotionalContext?: string };
      adjustedKeywordCount?: number;
      weightingDetails?: any[];
    };
    // Cumulative keywords across all messages, all frameworks
    cumulativeKeywords?: {
      riemann: Record<string, { high: string[]; low: string[] }>;
      big5: Record<string, { high: string[]; low: string[] }>;
      spiralDynamics: Record<string, { high: string[]; low: string[] }>;
      totalCount: number;
    };
  };
  
  // Auto-check results
  autoCheckResults: {
    checkId: string;
    passed: boolean;
    details?: string;
  }[];
  
  // DPFL Keywords Info (not a check, just information)
  dpflKeywordsInfo?: string;
  
  // Manual check results (filled by tester)
  manualCheckResults: {
    checkId: string;
    passed: boolean | null;  // null = not yet checked
    notes?: string;
  }[];
}

// ============================================
// Pre-defined Test Profile Building Blocks
// Each category has 2 options for multi-select
// ============================================

export const RIEMANN_PROFILES: RiemannProfileBlock[] = [
  {
    id: 'riemann_naehe',
    name: '💚 Nähe (Harmonie)',
    data: { naehe: 85, distanz: 25, dauer: 50, wechsel: 50 }
  },
  {
    id: 'riemann_distanz',
    name: '🔴 Distanz (Rationalität)',
    data: { naehe: 30, distanz: 80, dauer: 40, wechsel: 40 }
  },
  {
    id: 'riemann_dauer',
    name: '🔵 Dauer (Sicherheit)',
    data: { naehe: 40, distanz: 40, dauer: 85, wechsel: 20 }
  },
  {
    id: 'riemann_wechsel',
    name: '🟡 Wechsel (Flexibilität)',
    data: { naehe: 50, distanz: 35, dauer: 25, wechsel: 85 }
  }
];

export const SD_PROFILES: SDProfileBlock[] = [
  {
    id: 'sd_orange',
    name: '🟠 Orange (Leistung)',
    // Ranks 1-8 (1 = most dominant, 8 = least dominant)
    data: { beige: 8, purple: 7, red: 4, blue: 3, orange: 1, green: 5, yellow: 6, turquoise: 2 }
  },
  {
    id: 'sd_green',
    name: '🟢 Grün (Gemeinschaft)',
    // Ranks 1-8 (1 = most dominant, 8 = least dominant)
    data: { beige: 8, purple: 5, red: 7, blue: 4, orange: 6, green: 1, yellow: 2, turquoise: 3 }
  }
];

export const OCEAN_PROFILES: OCEANProfileBlock[] = [
  {
    id: 'ocean_balanced',
    name: '⚖️ Ausgeglichen',
    // OCEAN uses scale 1-5 (not 0-100!) - 3 is the midpoint
    data: { openness: 3, conscientiousness: 3, extraversion: 3, agreeableness: 3, neuroticism: 3 }
  },
  {
    id: 'ocean_high_openness',
    name: '🎨 Hohe Offenheit',
    // OCEAN uses scale 1-5 (not 0-100!)
    data: { openness: 5, conscientiousness: 2, extraversion: 3, agreeableness: 3, neuroticism: 2 }
  }
];

// ============================================
// Profile Combination Function
// Combines selected profile blocks into DPC-compatible format
// ============================================

export const combineProfiles = (
  riemann: RiemannProfileBlock | null,
  sd: SDProfileBlock | null,
  ocean: OCEANProfileBlock | null
): CombinedTestProfile => {
  const completedLenses: string[] = [];
  
  if (riemann) completedLenses.push('riemann');
  if (sd) completedLenses.push('sd');
  if (ocean) completedLenses.push('ocean');
  
  return {
    completedLenses,
    riemann: riemann ? { beruf: riemann.data } : undefined,
    spiralDynamics: sd ? { levels: sd.data } : undefined,
    big5: ocean ? ocean.data : undefined
  };
};

// ============================================
// Legacy TEST_PROFILES (kept for backward compatibility)
// ============================================

export const TEST_PROFILES: TestProfile[] = [
  {
    id: 'naehe_dominant',
    name: '💚 Nähe (Harmonie)',
    description: 'Hohe Nähe, niedrige Distanz - erwartet warme, empathische Antworten',
    profile: {
      path: 'RIEMANN',
      riemann: {
        beruf: { naehe: 85, distanz: 25, dauer: 50, wechsel: 50 }
      },
      big5: { openness: 3, conscientiousness: 3, extraversion: 4, agreeableness: 4, neuroticism: 2 }
    }
  },
  {
    id: 'user_profile',
    name: '👤 Mein Profil',
    description: 'Verwendet dein echtes Persönlichkeitsprofil',
    profile: {}
  }
];

// ============================================
// Test Scenarios - Category: Core
// ============================================

export const getDynamicTestScenarios = (t: (key: string) => string): DynamicTestScenario[] => [
  // ============================================
  // CORE CHAT FUNCTIONALITY
  // ============================================
  {
    id: 'core_response_quality',
    name: '💬 ' + t('test_core_response_quality'),
    description: t('test_core_response_quality_desc'),
    category: 'core',
    testsFeatures: ['formatting'],
    testMessages: [
      {
        text: t('test_core_msg_1'),
        expectedBehavior: t('test_core_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: false,
    },
    manualChecks: [
      t('test_check_response_helpful'),
      t('test_check_no_hallucination'),
      t('test_check_bot_character'),
    ]
  },
  {
    id: 'core_context_usage',
    name: '📝 ' + t('test_core_context_usage'),
    description: t('test_core_context_usage_desc'),
    category: 'core',
    testsFeatures: ['context'],
    testMessages: [
      {
        text: t('test_context_msg_1'),
        expectedBehavior: t('test_context_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: false,
    },
    manualChecks: [
      t('test_check_context_referenced'),
      t('test_check_context_accurate'),
    ]
  },

  // ============================================
  // SESSION MANAGEMENT
  // ============================================
  {
    id: 'session_update',
    name: '✏️ ' + t('test_session_update'),
    description: t('test_session_update_desc'),
    category: 'session',
    testsFeatures: ['context'],
    testMessages: [
      {
        text: t('test_session_msg_1'),
        expectedBehavior: t('test_session_msg_1_expected')
      },
      {
        text: t('test_session_msg_2'),
        expectedBehavior: t('test_session_msg_2_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: false,
      expectSessionUpdates: true, // Auto-check: proposedUpdates.length > 0
    },
    manualChecks: [
      t('test_check_update_format'),    // Manual: check headline & content quality
      t('test_check_update_accurate'),  // Manual: check content reflects conversation
    ]
  },
  {
    id: 'session_next_steps',
    name: '🎯 ' + t('test_session_next_steps'),
    description: t('test_session_next_steps_desc'),
    category: 'session',
    testsFeatures: ['context', 'formatting'],
    testMessages: [
      {
        text: t('test_nextsteps_msg_1'),
        expectedBehavior: t('test_nextsteps_msg_1_expected')
      },
      {
        text: t('test_nextsteps_msg_2'),
        expectedBehavior: t('test_nextsteps_msg_2_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: false,
      expectSessionNextSteps: true, // Auto-check: nextSteps.length > 0
      expectSessionUpdates: true, // Auto-check: proposedUpdates.length > 0
    },
    manualChecks: [
      t('test_check_nextsteps_actionable'), // Manual: check steps are concrete
      t('test_check_nextsteps_relevant'),   // Manual: check steps match topic
      t('test_check_update_accurate'),      // Manual: check update reflects conversation
    ]
  },

  // ============================================
  // PERSONALITY SYSTEM (DPC + DPFL)
  // ============================================
  {
    id: 'personality_loading',
    name: '🧑🏼‍💼 ' + t('test_personality_loading'),
    description: t('test_personality_loading_desc'),
    category: 'personality',
    testsFeatures: ['dpc'],
    testMessages: [
      {
        text: t('test_personality_msg_1'),
        expectedBehavior: t('test_personality_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true,
      minDpcLength: 100,
    },
    manualChecks: [
      t('test_check_dpc_injection'),
      t('test_check_profile_loaded'),
    ]
  },
  {
    id: 'personality_response_style',
    name: '🎨 ' + t('test_personality_response_style'),
    description: t('test_personality_response_style_desc'),
    category: 'personality',
    testsFeatures: ['dpc'],
    testMessages: [
      {
        text: t('test_style_msg_1'),
        expectedBehavior: t('test_style_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true,
      minDpcLength: 200,
    },
    manualChecks: [
      t('test_check_style_matches_profile'),
      t('test_check_not_generic'),
      t('test_check_bot_plus_personality'),
    ]
  },
  {
    id: 'personality_behavior_tracking',
    name: '📊 ' + t('test_dpfl_full'),
    description: t('test_dpfl_full_desc'),
    category: 'personality',
    testsFeatures: ['dpfl'],
    testMessages: [
      {
        text: t('test_dpfl_msg_1'),  // Contains keywords like "Sicherheit", "Planung" / "security", "planning"
        expectedBehavior: t('test_dpfl_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true, // DPFL = DPC + Keyword-Tracking, therefore DPC is required
      // Keywords must match language - German and English variants
      expectedKeywords: ['sicherheit', 'planung', 'struktur', 'security', 'planning', 'structure'],
    },
    manualChecks: [
      t('test_check_dpc_present'), // Manual: Bot adapts language to profile (DPC)
      t('test_check_dpfl_keywords_detected'), // Manual: System detected keywords correctly (DPFL)
    ]
  },
  {
    id: 'personality_blindspot',
    name: '🎯 ' + t('test_personality_blindspot'),
    description: t('test_personality_blindspot_desc'),
    category: 'personality',
    testsFeatures: ['dpc'],
    testMessages: [
      {
        text: t('test_blindspot_msg_1'),
        expectedBehavior: t('test_blindspot_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true,
    },
    manualChecks: [
      t('test_check_blindspot_addressed'),
      t('test_check_challenge_gentle'),
      t('test_check_not_pushy'),
    ]
  },
  {
    id: 'dpfl_keyword_deep_dive',
    name: '🔬 ' + t('test_dpfl_deep_dive'),
    description: t('test_dpfl_deep_dive_desc'),
    category: 'personality',
    testsFeatures: ['dpfl', 'dpc'],
    testMessages: [
      {
        text: t('test_dpfl_deep_msg_1'),
        expectedBehavior: t('test_dpfl_deep_msg_1_expected')
      }
    ],
    minConversationTurns: 7,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: true,
      minDpcLength: 100,
    },
    manualChecks: [
      t('test_check_dpfl_multi_framework'),
      t('test_check_dpfl_neuroticism_coverage'),
      t('test_check_dpfl_openness_coverage'),
      t('test_check_dpfl_naehe_coverage'),
      t('test_check_dpfl_no_false_positives'),
      t('test_check_dpfl_keyword_count'),
    ]
  },

  // ============================================
  // SAFETY & WELLBEING
  // ============================================
  {
    id: 'safety_crisis_response',
    name: '💚 ' + t('test_safety_crisis_response'),
    description: t('test_safety_crisis_response_desc'),
    category: 'safety',
    testsFeatures: ['dpfl'],
    testMessages: [
      {
        text: t('test_crisis_msg_1'),  // Emotional distress message
        expectedBehavior: t('test_crisis_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: false,
      expectStressKeywords: true, // Auto-check: stress keywords detected in telemetry
    },
    manualChecks: [
      t('test_check_crisis_response_shown'),
      t('test_check_response_supportive'),
      t('test_check_not_dismissive'),
    ]
  },

  // ============================================
  // BOT-SPECIFIC
  // ============================================
  {
    id: 'bot_interview',
    name: '🎤 ' + t('test_bot_interview'),
    description: t('test_bot_interview_desc'),
    category: 'bot',
    testsFeatures: ['formatting'],
    testMessages: [
      {
        text: t('test_interview_msg_1'),
        expectedBehavior: t('test_interview_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: false,
    },
    manualChecks: [
      t('test_check_interview_format'),
      t('test_check_interview_structure'),
      t('test_check_interview_questions'),
    ]
  },

  // ============================================
  // SESSION - COMFORT CHECK & REFINEMENT FLOW
  // ============================================
  // NOTE: This test CANNOT automatically verify the Comfort Check Modal!
  // The Test Runner only simulates conversations - it does NOT navigate to SessionReview.
  // 
  // To test the Comfort Check Modal:
  // 1. Run a normal DPFL session (NOT in Test Runner)
  // 2. Complete substantive conversation with coaching goal
  // 3. Click "Ende" button
  // 4. Check SessionReview for "+50 XP" bonus and Comfort Check Modal
  //
  // See docs/COMFORT-CHECK-TESTING.md for detailed manual testing instructions.
  {
    id: 'session_comfort_check_flow',
    name: '✓ ' + t('test_session_comfort_check'),
    description: t('test_session_comfort_check_desc'),
    category: 'session',
    testsFeatures: ['dpfl', 'comfort', 'refinement'],
    testMessages: [
      {
        text: t('test_session_comfort_msg_1'),
        expectedBehavior: t('test_session_comfort_msg_1_expected')
      }
    ],
    minConversationTurns: 3,
    enableDynamicContinuation: true,
    autoChecks: {
      dpcRequired: false,
      expectSessionUpdates: false,  // Not testing profile updates here
      expectSessionNextSteps: false,
    },
    manualChecks: [
      t('test_check_session_completed'),
      t('test_check_comfort_modal_shown'),
      t('test_check_comfort_rating_scale'),
      t('test_check_comfort_skip_button'),
      t('test_check_refinement_after_2nd'),
    ]
  },

  // ============================================
  // PROFILE REFINEMENT WITH MOCK DATA
  // ============================================
  {
    id: 'dpfl_refinement_mock',
    name: '🔄 ' + t('test_refinement_mock'),
    description: t('test_refinement_mock_desc'),
    category: 'personality',
    testsFeatures: ['dpfl', 'refinement'],
    testMessages: [
      {
        text: t('test_refinement_mock_msg_1'),
        expectedBehavior: t('test_refinement_mock_msg_1_expected')
      }
    ],
    minConversationTurns: 1,
    enableDynamicContinuation: false,
    specialTestMode: 'refinement_mock', // Triggers special logic in TestRunner
    autoChecks: {
      dpcRequired: false,
      expectSessionUpdates: false,
      expectSessionNextSteps: false,
    },
    manualChecks: [
      t('test_check_refinement_modal_shown'),
      t('test_check_refinement_suggestions_present'),
      t('test_check_refinement_bidirectional'),
      t('test_check_refinement_context_specific'),
    ]
  },
];

// ============================================
// Helper Functions
// ============================================

export const getScenariosByCategory = (scenarios: DynamicTestScenario[], category: TestCategory): DynamicTestScenario[] => {
  return scenarios.filter(s => s.category === category);
};

export const getCategoryIcon = (category: TestCategory): string => {
  const icons: Record<TestCategory, string> = {
    core: '💬',
    session: '📋',
    personality: '🧑🏼‍💼',
    safety: '💚',
    bot: '🤖',
  };
  return icons[category];
};

export const getCategoryName = (category: TestCategory, t: (key: string) => string): string => {
  const names: Record<TestCategory, string> = {
    core: t('test_category_core'),
    session: t('test_category_session'),
    personality: t('test_category_personality'),
    safety: t('test_category_safety'),
    bot: t('test_category_bot'),
  };
  return names[category];
};

// Available bots for testing (filter out hidden ones)
export const getTestableBots = (): Bot[] => {
  return BOTS.filter(b => b.id !== 'gloria-life-context'); // Interview bot has special handling
};

// ============================================
// Legacy Test Scenarios (for backward compatibility)
// Used by App.tsx and AdminView.tsx legacy runner
// ============================================

const simpleBot = BOTS.find(b => b.id === 'max-ambitious')!;
const reflectionBot = BOTS.find(b => b.id === 'chloe-cbt')!;
const interviewBot = BOTS.find(b => b.id === 'gloria-life-context')!;

export const getTestScenarios = (t: (key: string) => string): LegacyTestScenario[] => [
  {
    id: 'interview_formatting',
    name: t('scenario_interview_name'),
    description: t('scenario_interview_desc'),
    bot: interviewBot,
    chatHistory: [ 
      { id: '1', role: 'bot', text: t('scenario_interview_chathistory_bot'), timestamp: new Date().toISOString() },
      { id: '2', role: 'user', text: t('scenario_interview_chathistory_user'), timestamp: new Date().toISOString() },
      { id: '3', role: 'bot', text: t('scenario_interview_chathistory_bot2'), timestamp: new Date().toISOString() },
      { id: '4', role: 'user', text: t('scenario_interview_chathistory_user2'), timestamp: new Date().toISOString() },
    ],
  },
  {
    id: 'simple_update',
    name: t('scenario_simple_update_name'),
    description: t('scenario_simple_update_desc'),
    bot: simpleBot,
    chatHistory: [
      { id: '1', role: 'user', text: t('scenario_simple_update_user'), timestamp: new Date().toISOString() },
      { id: '2', role: 'bot', text: t('scenario_simple_update_bot'), timestamp: new Date().toISOString() },
      { id: '3', role: 'user', text: t('scenario_simple_update_user2'), timestamp: new Date().toISOString() },
    ],
  },
  {
    id: 'complex_update',
    name: t('scenario_complex_update_name'),
    description: t('scenario_complex_update_desc'),
    bot: reflectionBot,
    chatHistory: [
      { id: '1', role: 'user', text: t('scenario_complex_update_user1'), timestamp: new Date().toISOString() },
      { id: '2', role: 'bot', text: t('scenario_complex_update_bot1'), timestamp: new Date().toISOString() },
      { id: '3', role: 'user', text: t('scenario_complex_update_user2'), timestamp: new Date().toISOString() },
      { id: '4', role: 'bot', text: t('scenario_complex_update_bot2'), timestamp: new Date().toISOString() },
      { id: '5', role: 'user', text: t('scenario_complex_update_user3'), timestamp: new Date().toISOString() },
    ],
  },
  {
    id: 'next_steps',
    name: t('scenario_next_steps_name'),
    description: t('scenario_next_steps_desc'),
    bot: simpleBot,
    chatHistory: [
      { id: '1', role: 'user', text: t('scenario_next_steps_user1'), timestamp: new Date().toISOString() },
      { id: '2', role: 'bot', text: t('scenario_next_steps_bot1'), timestamp: new Date().toISOString() },
      { id: '3', role: 'user', text: t('scenario_next_steps_user2'), timestamp: new Date().toISOString() },
    ],
  },
];
