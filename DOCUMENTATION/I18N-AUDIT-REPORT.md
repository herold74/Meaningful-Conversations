# i18n Audit Report: Unused Translation Keys

**Date:** 2025-02-26  
**Locale file:** `public/locales/en.json`  
**Scope:** `.ts`, `.tsx`, `.js`, `.jsx` files (excluding `node_modules`, `dist`, `ios`, `public/locales`, `.cursor`)

---

## 1. Summary

| Metric | Count |
|--------|-------|
| **Total keys in en.json** | 1,802 |
| **Keys confirmed used** | ~1,414 |
| **Keys confirmed unused** | ~388 |
| **Keys with dynamic construction** | See Section 4 |

---

## 2. Dynamic Key Patterns Found in Code

These patterns construct translation keys at runtime. Keys matching these patterns should **NOT** be flagged as unused:

| Pattern | Location | Example |
|---------|----------|---------|
| `t(\`achievement_${def.id}_name\`)` | `achievements.ts` | `achievement_beta_pioneer_name`, `achievement_first_session_desc` |
| `t(\`achievement_${def.id}_desc\`)` | `achievements.ts` | Same as above |
| `t(\`admin_users_profile_filter_${f}\`)` | `AdminView.tsx` | `admin_users_profile_filter_all`, `_with`, `_without` |
| `t(\`survey_bfi2_item_${item.itemNum}\`)` | `utils/bfi2.ts` | `survey_bfi2_item_1` … `survey_bfi2_item_30` |
| `t(\`survey_bfi2_likert_${value}\`)` | `OceanOnboarding.tsx` | `survey_bfi2_likert_1` … `survey_bfi2_likert_5` |
| `t(\`bfi2_facet_${facetKey...}\`)` | `PersonalityProfileView.tsx` | `bfi2_facet_sociability`, `bfi2_facet_assertiveness`, etc. |
| `t(\`profile_view_${context}\`)` | `ProfileRefinementReview.tsx` | `profile_view_beruf`, `profile_view_privat`, `profile_view_selbst` |
| `t(\`sessionReview_action_${type}\`)` | `SessionReview.tsx` | `sessionReview_action_append`, `_replace_section`, `_create_headline` |
| `t(\`${intent.descKey}_guest\`)` | `IntentPickerView.tsx` | `intent_communication_desc_guest`, `intent_coaching_desc_guest`, `intent_lifecoaching_desc_guest` |
| `t(\`newsletter_subject_placeholder_${lang}\`)` | `NewsletterPanel.tsx` | `newsletter_subject_placeholder_de`, `_en` |
| `t(\`newsletter_body_placeholder_${lang}\`)` | `NewsletterPanel.tsx` | `newsletter_body_placeholder_de`, `_en` |
| `t(intent.titleKey)`, `t(intent.descKey)` | `IntentPickerView.tsx` | `intent_communication_title`, `intent_coaching_desc`, etc. |

---

## 3. Keys Confirmed Unused (with English values)

Keys that exist in `en.json` but have **no reference** in source code. Excludes keys that match dynamic patterns above.

### 3.1 App / General
| Key | English Value |
|-----|---------------|
| `meaningfulConversations` | Meaningful Conversations |

### 3.2 Auth / Verification
| Key | English Value |
|-----|---------------|
| `verifyEmail_success_subtitle` | You will be logged in automatically. |

### 3.3 Context Choice
| Key | English Value |
|-----|---------------|
| `contextChoice_confirm_cancel` | Cancel |

### 3.4 Bot Selection
| Key | English Value |
|-----|---------------|
| `botSelection_clientOnlySection` | Exclusive for {{providerName}} Clients |
| `botSelection_clientAccessMessage` | These coaches are exclusively available for {{providerName}} clients... |
| `botSelection_goBack` | Go Back |
| `botSearch_loading` | Finding the right coach ... |
| `botSearch_section_desc` | Describe your situation – we'll recommend the right coach. |

### 3.5 Guest / Limits
| Key | English Value |
|-----|---------------|
| `guest_limit_warning` | You have reached your weekly limit of 50 messages... |
| `guest_limit_exceeded_title` | Message Limit Reached |
| `guest_register_now` | Register Now |

### 3.6 Chat
| Key | English Value |
|-----|---------------|
| `chat_welcome` | Hello, I'm {{botName}}. What's on your mind today? |
| `chat_speaking` | Speaking... |
| `chat_play_last_message` | Play last message |

### 3.7 Session Review
| Key | English Value |
|-----|---------------|
| `sessionReview_no_updates` | No updates were proposed in this session. |
| `sessionReview_action_create_headline` | Create |

### 3.8 Achievements (DYNAMIC – used via `t(\`achievement_${id}_name\`)`)
All `achievement_*_name` and `achievement_*_desc` keys are **used dynamically** in `achievements.ts`. Do not remove.

### 3.9 Menu
| Key | English Value |
|-----|---------------|
| `menu_achievements` | Achievements |

### 3.10 Disclaimer / Export
| Key | English Value |
|-----|---------------|
| `disclaimer_delete_warning` | Deleting your account is a **permanent** action... |
| `export_data_note_title` | Note |
| `export_data_note_encrypted` | Your encrypted Life Context will be automatically decrypted... |

### 3.11 Admin (partial – many are used)
| Key | English Value |
|-----|---------------|
| `admin_feedback_tab` | Feedback |
| `admin_codes_coach` | Unlocks Coach |
| `admin_codes_registered_1m` | Registered 1-Month Pass (€3.90) |
| `admin_codes_section_passes` | Passes |
| `admin_codes_status_used` | Used |
| `admin_codes_used_by` | Used by |
| `admin_feedback_no_feedback` | No feedback has been submitted yet. |
| `admin_feedback_show_context` | Show Context |
| `admin_feedback_hide_context` | Hide Context |
| `admin_ratings_overall_avg` | Overall Average Rating |
| `admin_ratings_total_ratings` | from {{count}} total ratings |
| `admin_feedback_context_short` | Context |

### 3.12 Voice Modal
| Key | English Value |
|-----|---------------|
| `voiceModal_ios_unavailable` | Not available on iOS |
| `voiceModal_ios_hint` | Server voices are not available on iOS... |
| `voiceModal_preview_aria` | Preview voice for {{name}} |
| `voiceModal_cancel` | Cancel |

### 3.13 Blockages (PEP)
| Key | English Value |
|-----|---------------|
| `blockage_self-reproach` | Self-Reproach |
| `blockage_blaming_others` | Blaming Others |
| `blockage_expectational_attitudes` | Expectational Attitudes |
| `blockage_age_regression` | Age Regression |
| `blockage_dysfunctional_loyalties` | Dysfunctional Loyalties |

### 3.14 Paywall
| Key | English Value |
|-----|---------------|
| `paywall_ios_hint` | In-app purchase via the App Store will be available soon... |
| `paywall_purchase_button` | Purchase Access Pass |

### 3.15 Calendar
| Key | English Value |
|-----|---------------|
| `calendar_event_description` | Reminder: Revisit the {{appName}} app to track progress... |

### 3.16 Experimental Mode Badges
| Key | English Value |
|-----|---------------|
| `experimental_mode_badge_dpc` | 🧪 DPC |
| `experimental_mode_badge_dpfl` | 📊 DPFL |

### 3.17 Personality Survey Success Messages
| Key | English Value |
|-----|---------------|
| `personality_survey_success_saved` | PDF downloaded and profile encrypted successfully!... |
| `personality_survey_success_saved_no_download` | Profile encrypted and saved! ✨... |

### 3.18 Profile View
| Key | English Value |
|-----|---------------|
| `profile_view_test_type` | Test Type |
| `profile_view_filter_scores` | Filter Scores |
| `profile_view_worry` | Worry about Control |
| `profile_view_control` | Sense of agency |
| `profile_view_pdf_requires_signature` | PDF download available after signature generation |
| `profile_view_pdf_hint` | Generate your personal signature first ↑ |
| `profile_view_new_test` | New Evaluation |
| `profile_view_info_title` | Note |
| `profile_view_info_text` | You can take a new test anytime to update your profile. |

### 3.19 Microphone
| Key | English Value |
|-----|---------------|
| `microphone_not_found` | No microphone found... |

### 3.20 Big5 / Interpretation
| Key | English Value |
|-----|---------------|
| `big5_openness` | Openness |
| `big5_conscientiousness` | Conscientiousness |
| `big5_extraversion` | Extraversion |
| `big5_agreeableness` | Agreeableness |
| `big5_neuroticism` | Emotional Stability |
| `big5_negativeEmotionality` | Negative Emotionality |
| `interpretation_high` | High |
| `interpretation_medium` | Medium |
| `interpretation_low` | Low |

### 3.21 Comfort Check
| Key | English Value |
|-----|---------------|
| `comfort_check_use_session` | Use for Profile Refinement |

### 3.22 Profile Refined
| Key | English Value |
|-----|---------------|
| `profile_view_refined_title` | Refined |
| `profile_view_refined_desc` | This profile has been refined through {{count}} authentic sessions. |

### 3.23 Riemann Dimensions (full labels)
| Key | English Value |
|-----|---------------|
| `riemann_dimension_dauer_full` | Consistency (Structure) |
| `riemann_dimension_naehe_full` | Closeness (Harmony) |
| `riemann_dimension_wechsel_full` | Spontaneity (Transformation) |
| `riemann_dimension_distanz_full` | Distance (Rationality) |

### 3.24 DPC/DPFL Test Scenarios (Legacy Admin Runner – NOT wired to getTestScenarios)

The following scenario keys exist in locales but are **never referenced** in code. The legacy `getTestScenarios()` only uses `scenario_interview_*`, `scenario_simple_update_*`, `scenario_complex_update_*`, and `scenario_next_steps_*`. The DPC/DPFL scenarios were prepared but never integrated:

- `scenario_dpc_riemann_name` … `scenario_dpc_riemann_bot10`
- `scenario_dpc_ocean_name` … `scenario_dpc_ocean_bot10`
- `scenario_dpfl_riemann_name` … `scenario_dpfl_riemann_bot11`
- `scenario_dpfl_ocean_name` … `scenario_dpfl_ocean_bot11`
- `scenario_dpc_blindspot_name` … `scenario_dpc_blindspot_bot10`

### 3.25 Admin Runner (DPC/DPFL)
| Key | English Value |
|-----|---------------|
| `admin_runner_dpc_title` | DPC Test Requirements |
| `admin_runner_dpc_req1` | Requires: Registered test user with Riemann or OCEAN profile |
| `admin_runner_dpc_req2` | Coach should be Chloe (with experimental mode DPC) |
| `admin_runner_dpc_check1` | Check: Coach considers profile dimensions in responses |
| `admin_runner_dpc_check2` | Check: Language and style match personality... |
| `admin_runner_dpfl_title` | DPFL Test Requirements |
| `admin_runner_dpfl_req1` | Requires: Registered test user with Riemann or OCEAN profile |
| `admin_runner_dpfl_req2` | Coach should be Chloe (with experimental mode DPFL) |
| `admin_runner_dpfl_check1` | Check: Behavior logging counts keywords (Console Log) |
| `admin_runner_dpfl_check2` | Check: Comfort Check modal appears after session |
| `admin_runner_dpfl_check3` | Check: Session Count increments when Comfort Score >= 3 |
| `admin_runner_your_profile` | Your profile |
| `admin_runner_profile_mismatch` | Scenario doesn't match profile type |
| `admin_runner_no_profile` | No personality profile found... |
| `admin_comfort_test_with_end` | WITH closure (Comfort Check appears) |
| `admin_comfort_test_without_end` | WITHOUT closure (Comfort Check does NOT appear) |

### 3.26 DPFL Test Summary
| Key | English Value |
|-----|---------------|
| `dpfl_test_summary_dpc_title` | DPC Test - Profile-Adaptive Coaching |
| `dpfl_test_summary_dpfl_title` | DPFL Test - Learning Loop & Profile Refinement |
| `dpfl_test_summary_dpc_desc` | This test checks if the Dynamic Prompt Controller... |
| `dpfl_test_summary_dpfl_desc` | This test checks the complete DPFL learning loop... |
| `dpfl_test_summary_check_console` | Check in Browser Console |
| `dpfl_test_summary_dpc_check1` … `dpfl_test_summary_dpfl_tip` | (multiple keys) |

### 3.27 Refinement Modal
| Key | English Value |
|-----|---------------|
| `refinement_modal_saved` | Profile has been updated. |
| `refinement_modal_test_saved` | Preview: Changes would be saved here. |

### 3.28 Survey / SD / Narrative (many keys)
- `survey_lens_intro_first`, `survey_lens_completed`, `survey_lens_recommended`
- `survey_sd_title`
- `sd_statement_*`, `sd_viz_*`, `sd_tension_*`, `sd_category_*`, `sd_legend_*`
- `narrative_profile_regenerate`, `narrative_profile_generating`, `narrative_profile_os_title`
- `narrative_update_hint`, `narrative_update_hint_short`, `narrative_missing_stories`
- `profile_adaptation_adaptive_desc`, `profile_adaptation_stable_desc`
- `survey_filter_title`, `survey_likert_*`, `survey_btn_skip`
- `intent_need_context_hint`
- `coaching_mode_dpfl_requires_adaptive`, `coaching_mode_dpfl_nobody_note`, `coaching_mode_dpfl_nobody_short`, `coaching_mode_info`
- `profile_add_facet_hint`, `profile_add_facet_button`, `profile_complete_hint`
- `context_region`, `context_region_placeholder`, `context_region_hint`
- `crisis_contact_manualmode`, `crisis_regional_resources`
- Various `test_*`, `context_topic_*`, `context_pattern_*`, `context_emotion_*` keys
- `te_desktop_only`, `te_tools_section`, `te_input_audio_success`, `te_input_audio_or_upload`
- `te_review_bot_start_chat`, `te_review_context_updates`, `te_review_score_out_of`
- `admin_te_ratings_*`, `delete`
- `interview_transcript_*` (multiple keys)

---

## 4. Keys That MIGHT Be Dynamically Constructed

| Pattern | Keys Matching | Notes |
|---------|---------------|-------|
| `achievement_*_name`, `achievement_*_desc` | 12 keys | Used in `achievements.ts` |
| `admin_users_profile_filter_*` | 3 keys | Used in `AdminView.tsx` |
| `survey_bfi2_item_*` | 30 keys | Used in `bfi2.ts` |
| `survey_bfi2_likert_*` | 5 keys | Used in `OceanOnboarding.tsx` |
| `newsletter_subject_placeholder_*`, `newsletter_body_placeholder_*` | 4 keys | Used in `NewsletterPanel.tsx` |
| `bfi2_facet_*` | 15 keys | Used in `PersonalityProfileView.tsx` |
| `profile_view_beruf`, `profile_view_privat`, `profile_view_selbst` | 3 keys | Used in `ProfileRefinementReview.tsx` |
| `sessionReview_action_*` | 3 keys | Used in `SessionReview.tsx` |
| `intent_*_desc_guest` | 3 keys | Used in `IntentPickerView.tsx` |

---

## 5. Recommendations

1. **Do not remove** keys that match dynamic patterns in Section 4.
2. **Review before removal**: Keys in Section 3 may be used in:
   - Backend or server-rendered content
   - Config files or JSON not in the search scope
   - Future or deprecated features
3. **DPC/DPFL scenarios**: Either wire `scenario_dpc_*` and `scenario_dpfl_*` into the Admin Runner or remove them if the feature is abandoned.
4. **Missing key**: `back` is used in `ImprintView.tsx`, `PrivacyPolicyView.tsx`, `OceanOnboarding.tsx` but is **not** in `en.json`. Consider adding it.

---

## 6. Methodology

1. Extracted all top-level keys from `public/locales/en.json`.
2. Searched all `.ts`, `.tsx`, `.js`, `.jsx` files for each key (excluding `node_modules`, `dist`, `ios`, `public/locales`, `.cursor`).
3. Identified dynamic key construction patterns via grep for `t(\`` and variable-based `t()` calls.
4. Cross-referenced with `IntentPickerView`, `achievements.ts`, `AdminView`, `bfi2.ts`, `OceanOnboarding`, `PersonalityProfileView`, `ProfileRefinementReview`, `SessionReview`, `NewsletterPanel`.
