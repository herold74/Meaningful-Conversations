const { CONNECTOR_VIGNETTES, getVignetteById, VIGNETTES_PER_RUN } = require('./vignettes.js');

/** Stratified buckets for assessment runs (one pick per bucket max). */
const ASSESSMENT_BUCKETS = {
  emotion: ['jonas-meeting', 'leila-breakup', 'carmen-mia'],
  advice: ['tom-vancouver'],
  deflection: ['david-exhaustion'],
  repair: ['sophie-repair'],
  joy: ['marc-promotion'],
  work: ['nina-review'],
};

const RELATIONSHIP_CATEGORY = {
  'jonas-meeting': 'work',
  'leila-breakup': 'friend',
  'tom-vancouver': 'family',
  'carmen-mia': 'neighbor',
  'david-exhaustion': 'friend',
  'sophie-repair': 'friend',
  'marc-promotion': 'friend',
  'nina-review': 'work',
};

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function countBy(arr, fn) {
  const counts = {};
  for (const item of arr) {
    const key = fn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function isValidAssessmentTrio(ids) {
  if (ids.length !== VIGNETTES_PER_RUN || new Set(ids).size !== VIGNETTES_PER_RUN) {
    return false;
  }

  const vignettes = ids.map((id) => getVignetteById(id)).filter(Boolean);
  if (vignettes.length !== VIGNETTES_PER_RUN) return false;

  const relCounts = countBy(vignettes, (v) => RELATIONSHIP_CATEGORY[v.id] || 'other');
  if (Object.values(relCounts).some((n) => n > 2)) return false;

  const genderCounts = countBy(vignettes, (v) => v.gender);
  if (Object.values(genderCounts).some((n) => n > 2)) return false;

  const bucketsUsed = new Set(
    ids.map((id) => {
      for (const [bucket, members] of Object.entries(ASSESSMENT_BUCKETS)) {
        if (members.includes(id)) return bucket;
      }
      return 'unknown';
    }),
  );
  return bucketsUsed.size === VIGNETTES_PER_RUN;
}

/**
 * Pick 3 vignettes for a first assessment run: stratified buckets, relationship/gender mix.
 */
function pickAssessmentVignetteIds(count = VIGNETTES_PER_RUN) {
  const bucketKeys = Object.keys(ASSESSMENT_BUCKETS);
  const maxAttempts = 40;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const chosenBuckets = shuffleInPlace([...bucketKeys]).slice(0, count);
    const ids = chosenBuckets.map((bucket) => pickRandomFrom(ASSESSMENT_BUCKETS[bucket]));
    if (isValidAssessmentTrio(ids)) return ids;
  }

  // Fallback: distinct random ids
  const allIds = CONNECTOR_VIGNETTES.map((v) => v.id);
  shuffleInPlace(allIds);
  return allIds.slice(0, Math.min(count, allIds.length));
}

module.exports = {
  ASSESSMENT_BUCKETS,
  pickAssessmentVignetteIds,
  isValidAssessmentTrio,
};
