export type LocalModelFeature = 'sam' | 'connector' | 'transcript';
export type LocalModelMode = 'local' | 'online';

const KEY = 'mc_local_model_mode_v1';

export const SAM_BOT_ID = 'sam-forward-focused';

type Store = Partial<Record<LocalModelFeature, LocalModelMode>>;

function readStore(): Store {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getLocalModelMode(feature: LocalModelFeature): LocalModelMode {
  return readStore()[feature] === 'local' ? 'local' : 'online';
}

export function setLocalModelMode(feature: LocalModelFeature, mode: LocalModelMode): void {
  if (typeof localStorage === 'undefined') return;
  const next = { ...readStore(), [feature]: mode };
  localStorage.setItem(KEY, JSON.stringify(next));
}
