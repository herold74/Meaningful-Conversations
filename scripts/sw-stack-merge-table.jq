# npm outdated merge + stack-package-tracker.json
# jq -r -f sw-stack-merge-table.jq --slurpfile tracker stack-package-tracker.json \
#     --slurpfile feout frontend-outdated.json --slurpfile beout backend-outdated.json

def merge_outdated($fe; $be):
  (($fe // {}) * ($be // {}));

def major_num($v):
  if $v == null or $v == "" or $v == "MISSING" or $v == "aktuell" then 0
  else ($v | split(".")[0] | tonumber? // 0)
  end;

def patch_kind($cur; $want; $lat):
  if $cur == "aktuell" then "—"
  elif $cur == null or $lat == null then "?"
  elif $cur == $lat and (($want == $lat) or ($want == $cur)) then "—"
  elif (major_num($cur)) < (major_num($lat)) then "Major"
  else "Patch/Minor"
  end;

def tracker_for($name; $t):
  ($t.packages[] | select(.name == $name)) // null;

def risk_for($name; $kind; $tr):
  if $tr != null then $tr.migrationRisk
  elif $kind == "Major" then "hoch"
  elif $kind == "Patch/Minor" then "niedrig"
  else "—"
  end;

def qa_for($patches; $meta):
  if $meta != null and ($meta.qaEffort? != null) then $meta.qaEffort
  elif $patches == "Major" then "mittel"
  elif $patches == "Patch/Minor" then "leicht"
  else "—"
  end;

null
| ($tracker[0]) as $tr
| ($feout[0] // {}) as $fe
| ($beout[0] // {}) as $be
| merge_outdated($fe; $be) as $out
| ($tr.packages | map(.name)) as $tracked
| ($out | keys) as $outdated
| ($tracked + $outdated | unique | sort) as $names
| $names[]
| . as $name
| ($out[$name]) as $o
| tracker_for($name; $tr) as $meta
| (if $o then ($o.current | tostring) else "aktuell" end) as $cur
| (if $o then ($o.wanted | tostring) else "aktuell" end) as $want
| (if $o then ($o.latest | tostring) else "aktuell" end) as $lat
| patch_kind($cur; $want; $lat) as $patches
| {
    package: $name,
    scope: (if $meta then $meta.scope else (if $fe[$name] then "frontend" elif $be[$name] then "backend" else "?" end) end),
    priority: (if $meta then $meta.priority else "—" end),
    current: $cur,
    wanted: $want,
    latest: $lat,
    patches: $patches,
    risk: risk_for($name; $patches; $meta),
    qa: qa_for($patches; $meta),
    features: (if $meta then $meta.featuresNote else "—" end),
    dependencies: (if $meta then $meta.dependencies else "—" end)
  }
