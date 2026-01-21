# Mistral Medium Model-Auswahl mit Chat/Analyse-Differenzierung

## Übersicht

Erweitere das Model-Mapping von 2-stufig (Flash/Pro) auf 3-stufig (Small/Medium/Large) mit separater Konfiguration für Chat und Analyse.

## Aktuelle Situation

### Model-Verwendung im Code:
- **Chat**: `gemini-2.5-flash` (routes/gemini.js:194)
- **Analyse**: `gemini-2.5-pro` (routes/gemini.js:479)
- **Formatting**: `gemini-2.5-pro` (routes/gemini.js:617)
- **Translation**: `gemini-2.5-flash` (routes/gemini.js:47)

### Aktuelles Mapping (2-stufig):
```json
{
  "flash": "mistral-small-latest",
  "pro": "mistral-large-latest"
}
```

### Verfügbare Mistral-Modelle:
- `mistral-small-latest` (günstig, schnell)
- `mistral-medium-latest` (mittlere Leistung/Kosten)
- `mistral-large-latest` (beste Leistung, teuer)

## Ziel-Architektur

### Neues Mapping (3-stufig + differenziert):
```json
{
  "chat": {
    "flash": "mistral-small-latest",
    "standard": "mistral-medium-latest",
    "pro": "mistral-large-latest"
  },
  "analysis": {
    "flash": "mistral-small-latest",
    "standard": "mistral-medium-latest",
    "pro": "mistral-large-latest"
  }
}
```

## Implementierungsplan

### 1. Backend: Model-Mapping erweitern

**Datei**: `meaningful-conversations-backend/services/aiProviderService.js`

#### Änderungen:

1. **`getModelMapping()` erweitern** (Zeilen 71-99):
   - Neue Struktur mit `chat` und `analysis` Keys
   - Standard-Mapping für beide Kontexte
   - Abwärtskompatibilität für altes 2-stufiges Format

2. **`mapToMistralModel()` erweitern** (Zeilen 106-118):
   - Neuer Parameter `context: 'chat' | 'analysis'`
   - Logic für 3-stufiges Mapping:
     - `flash` → `mapping[context].flash` (Small)
     - `standard` → `mapping[context].standard` (Medium)
     - `pro` → `mapping[context].pro` (Large)
   - Fallback für alte Mapping-Struktur

3. **`generateContent()` erweitern** (Zeilen 129-162):
   - Neuer optionaler Parameter `context: 'chat' | 'analysis'`
   - Wird an `mapToMistralModel()` weitergegeben
   - Default: `'chat'`

4. **`generateWithMistral()` erweitern** (Zeilen 192-263):
   - `context`-Parameter akzeptieren
   - An `mapToMistralModel()` weitergeben

#### Code-Struktur:
```javascript
// Neues Default-Mapping
{
  chat: {
    flash: 'mistral-small-latest',
    standard: 'mistral-medium-latest',
    pro: 'mistral-large-latest'
  },
  analysis: {
    flash: 'mistral-small-latest',
    standard: 'mistral-medium-latest',
    pro: 'mistral-large-latest'
  }
}

// Neue Funktion-Signatur
async function mapToMistralModel(googleModel, context = 'chat') {
  const mapping = await getModelMapping();
  
  // Abwärtskompatibilität
  if (!mapping.chat && !mapping.analysis) {
    // Altes Format
    if (googleModel.includes('flash')) return mapping.flash;
    if (googleModel.includes('pro')) return mapping.pro;
    return mapping.flash;
  }
  
  // Neues Format mit Context
  const contextMapping = mapping[context] || mapping.chat;
  
  // 3-stufiges Mapping
  if (googleModel.includes('flash')) {
    return contextMapping.flash || 'mistral-small-latest';
  } else if (googleModel.includes('standard') || googleModel.includes('medium')) {
    return contextMapping.standard || 'mistral-medium-latest';
  } else if (googleModel.includes('pro')) {
    return contextMapping.pro || 'mistral-large-latest';
  }
  
  return contextMapping.flash || 'mistral-small-latest';
}
```

---

### 2. Backend: API-Routes anpassen

**Datei**: `meaningful-conversations-backend/routes/gemini.js`

#### Änderungen:

1. **Chat-Route** (Zeile 220):
   ```javascript
   const response = await aiProviderService.generateContent({
       model: modelName,
       contents: isInitialMessage ? "" : modelHistory,
       config: config,
       context: 'chat'  // NEU
   });
   ```

2. **Analyse-Route** (Zeile ~490):
   ```javascript
   const response = await aiProviderService.generateContent({
       model: modelName,
       contents: fullPrompt,
       config: { temperature: 0.3, responseMimeType: 'application/json', responseSchema },
       context: 'analysis'  // NEU
   });
   ```

3. **Formatting-Route** (Zeile ~630):
   ```javascript
   const response = await aiProviderService.generateContent({
       model: modelName,
       contents: fullPrompt,
       config: { temperature: 0.3 },
       context: 'analysis'  // NEU (Formatting ist auch Analyse)
   });
   ```

---

### 3. Backend: Admin-API erweitern

**Neue Datei**: `meaningful-conversations-backend/routes/aiModelMapping.js`

```javascript
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authMiddleware, adminAuthMiddleware } = require('../middlewares/authMiddleware');

// GET /api/ai-model-mapping - Get current mapping
router.get('/', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: 'AI_MODEL_MAPPING' }
    });
    
    const mapping = config?.value ? JSON.parse(config.value) : {
      chat: {
        flash: 'mistral-small-latest',
        standard: 'mistral-medium-latest',
        pro: 'mistral-large-latest'
      },
      analysis: {
        flash: 'mistral-small-latest',
        standard: 'mistral-medium-latest',
        pro: 'mistral-large-latest'
      }
    };
    
    res.json({ mapping });
  } catch (error) {
    console.error('Error fetching model mapping:', error);
    res.status(500).json({ error: 'Failed to fetch model mapping' });
  }
});

// PUT /api/ai-model-mapping - Update mapping
router.put('/', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { mapping } = req.body;
    const adminEmail = req.user.email;
    
    // Validation
    if (!mapping || !mapping.chat || !mapping.analysis) {
      return res.status(400).json({ error: 'Invalid mapping structure' });
    }
    
    const validModels = ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'];
    
    for (const context of ['chat', 'analysis']) {
      for (const tier of ['flash', 'standard', 'pro']) {
        if (!validModels.includes(mapping[context][tier])) {
          return res.status(400).json({ 
            error: `Invalid model for ${context}.${tier}: ${mapping[context][tier]}` 
          });
        }
      }
    }
    
    // Update database
    await prisma.appConfig.upsert({
      where: { key: 'AI_MODEL_MAPPING' },
      update: {
        value: JSON.stringify(mapping),
        updatedBy: adminEmail
      },
      create: {
        key: 'AI_MODEL_MAPPING',
        value: JSON.stringify(mapping),
        updatedBy: adminEmail
      }
    });
    
    // Clear cache in aiProviderService
    const aiProviderService = require('../services/aiProviderService');
    aiProviderService.clearModelMappingCache();
    
    console.log(`✓ AI Model Mapping updated by ${adminEmail}`);
    res.json({ success: true, mapping });
    
  } catch (error) {
    console.error('Error updating model mapping:', error);
    res.status(500).json({ error: 'Failed to update model mapping' });
  }
});

module.exports = router;
```

**In**: `meaningful-conversations-backend/server.js` registrieren:
```javascript
const aiModelMappingRoutes = require('./routes/aiModelMapping');
app.use('/api/ai-model-mapping', aiModelMappingRoutes);
```

**In**: `aiProviderService.js` Cache-Clear-Funktion hinzufügen:
```javascript
function clearModelMappingCache() {
  cachedModelMapping = null;
}

module.exports = {
  // ... existing exports
  clearModelMappingCache,
};
```

---

### 4. Frontend: Admin-UI erweitern

**Datei**: `components/ApiUsageView.tsx`

#### Änderungen:

1. **Nach dem AI Provider Management Panel** (nach Zeile 393):
   - Neues Panel für Model-Mapping einfügen
   - Zwei Spalten: Chat | Analyse
   - Drei Dropdowns pro Spalte: Flash, Standard, Pro
   - Save-Button

2. **Neue State-Variablen**:
   ```typescript
   const [modelMapping, setModelMapping] = useState<ModelMapping | null>(null);
   const [loadingMapping, setLoadingMapping] = useState(false);
   const [savingMapping, setSavingMapping] = useState(false);
   ```

3. **Interface-Definitionen**:
   ```typescript
   interface ModelMapping {
     chat: {
       flash: string;
       standard: string;
       pro: string;
     };
     analysis: {
       flash: string;
       standard: string;
       pro: string;
     };
   }
   ```

4. **API-Funktionen**:
   ```typescript
   const fetchModelMapping = async () => {
     setLoadingMapping(true);
     try {
       const data = await apiFetch('/ai-model-mapping');
       setModelMapping(data.mapping);
     } catch (err) {
       console.error('Failed to fetch model mapping:', err);
     } finally {
       setLoadingMapping(false);
     }
   };
   
   const saveModelMapping = async () => {
     if (!modelMapping) return;
     
     setSavingMapping(true);
     try {
       await apiFetch('/ai-model-mapping', {
         method: 'PUT',
         body: JSON.stringify({ mapping: modelMapping })
       });
       alert('Model mapping updated successfully!');
     } catch (err) {
       console.error('Failed to save model mapping:', err);
       alert('Failed to save model mapping: ' + (err.message || 'Unknown error'));
     } finally {
       setSavingMapping(false);
     }
   };
   ```

5. **UI-Komponente**:
   ```tsx
   {/* Model Mapping Configuration Panel */}
   {modelMapping && (
     <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg shadow-md">
       <div className="mb-4">
         <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
           <ZapIcon className="w-6 h-6 text-purple-500" />
           Mistral Model Mapping Configuration
         </h3>
         <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
           Configure which Mistral models to use for different contexts and tiers
         </p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
         {/* Chat Configuration */}
         <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
           <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
             <ChatBubbleIcon className="w-5 h-5 text-blue-500" />
             Chat Models
           </h4>
           <div className="space-y-3">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Flash (Fast & Cheap)
               </label>
               <select
                 value={modelMapping.chat.flash}
                 onChange={(e) => setModelMapping({
                   ...modelMapping,
                   chat: { ...modelMapping.chat, flash: e.target.value }
                 })}
                 className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
               >
                 <option value="mistral-small-latest">Mistral Small</option>
                 <option value="mistral-medium-latest">Mistral Medium</option>
                 <option value="mistral-large-latest">Mistral Large</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Standard (Balanced)
               </label>
               <select
                 value={modelMapping.chat.standard}
                 onChange={(e) => setModelMapping({
                   ...modelMapping,
                   chat: { ...modelMapping.chat, standard: e.target.value }
                 })}
                 className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
               >
                 <option value="mistral-small-latest">Mistral Small</option>
                 <option value="mistral-medium-latest">Mistral Medium</option>
                 <option value="mistral-large-latest">Mistral Large</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Pro (Best Quality)
               </label>
               <select
                 value={modelMapping.chat.pro}
                 onChange={(e) => setModelMapping({
                   ...modelMapping,
                   chat: { ...modelMapping.chat, pro: e.target.value }
                 })}
                 className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
               >
                 <option value="mistral-small-latest">Mistral Small</option>
                 <option value="mistral-medium-latest">Mistral Medium</option>
                 <option value="mistral-large-latest">Mistral Large</option>
               </select>
             </div>
           </div>
         </div>
         
         {/* Analysis Configuration */}
         <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
           <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
             <ActivityIcon className="w-5 h-5 text-purple-500" />
             Analysis Models
           </h4>
           <div className="space-y-3">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Flash (Fast & Cheap)
               </label>
               <select
                 value={modelMapping.analysis.flash}
                 onChange={(e) => setModelMapping({
                   ...modelMapping,
                   analysis: { ...modelMapping.analysis, flash: e.target.value }
                 })}
                 className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
               >
                 <option value="mistral-small-latest">Mistral Small</option>
                 <option value="mistral-medium-latest">Mistral Medium</option>
                 <option value="mistral-large-latest">Mistral Large</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Standard (Balanced)
               </label>
               <select
                 value={modelMapping.analysis.standard}
                 onChange={(e) => setModelMapping({
                   ...modelMapping,
                   analysis: { ...modelMapping.analysis, standard: e.target.value }
                 })}
                 className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
               >
                 <option value="mistral-small-latest">Mistral Small</option>
                 <option value="mistral-medium-latest">Mistral Medium</option>
                 <option value="mistral-large-latest">Mistral Large</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Pro (Best Quality)
               </label>
               <select
                 value={modelMapping.analysis.pro}
                 onChange={(e) => setModelMapping({
                   ...modelMapping,
                   analysis: { ...modelMapping.analysis, pro: e.target.value }
                 })}
                 className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm"
               >
                 <option value="mistral-small-latest">Mistral Small</option>
                 <option value="mistral-medium-latest">Mistral Medium</option>
                 <option value="mistral-large-latest">Mistral Large</option>
               </select>
             </div>
           </div>
         </div>
       </div>
       
       <div className="flex justify-end">
         <button
           onClick={saveModelMapping}
           disabled={savingMapping}
           className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
         >
           {savingMapping ? <Spinner /> : 'Save Model Mapping'}
         </button>
       </div>
     </div>
   )}
   ```

6. **useEffect erweitern**:
   ```typescript
   useEffect(() => {
     fetchUsageData();
     fetchProviderConfig();
     fetchModelMapping(); // NEU
   }, [timeRange, startDate, endDate]);
   ```

---

### 5. Testing & Validierung

#### Test-Szenarien:

1. **Altes Mapping-Format (Abwärtskompatibilität)**:
   - Datenbank hat noch altes 2-stufiges Format
   - System sollte weiterhin funktionieren
   - UI zeigt Standard-Werte an

2. **Neues Mapping speichern**:
   - Admin wählt verschiedene Modelle für Chat/Analyse
   - Speichern → Datenbank-Update
   - Cache wird geleert
   - Neue Requests verwenden neue Mappings

3. **Chat-Request mit Mistral**:
   - Provider auf Mistral umschalten
   - Chat starten
   - Logs prüfen: `context: 'chat'` wird verwendet
   - Richtiges Mistral-Modell wird aufgerufen

4. **Analyse-Request mit Mistral**:
   - Session-Analyse durchführen
   - Logs prüfen: `context: 'analysis'` wird verwendet
   - Separates Mistral-Modell wird aufgerufen

5. **Model-Mapping in Usage-Stats**:
   - API Usage View öffnen
   - Prüfen ob `mistral-medium-latest` in Stats erscheint
   - Cost-Berechnung korrekt

---

## Implementierungs-Reihenfolge

1. ✅ **Backend: aiProviderService.js erweitern**
   - `getModelMapping()` mit neuer Struktur
   - `mapToMistralModel()` mit Context-Parameter
   - `generateContent()` mit Context-Parameter
   - `clearModelMappingCache()` Funktion

2. ✅ **Backend: API-Routes anpassen**
   - gemini.js: `context` Parameter bei allen `generateContent()` Calls

3. ✅ **Backend: Admin-API erstellen**
   - aiModelMapping.js Route
   - In server.js registrieren

4. ✅ **Frontend: Admin-UI erweitern**
   - ApiUsageView.tsx: Model-Mapping Panel
   - State, Fetch, Save Logic
   - UI-Komponenten

5. ✅ **Testing**
   - Abwärtskompatibilität
   - CRUD für Model-Mapping
   - Chat mit verschiedenen Mappings
   - Analyse mit verschiedenen Mappings

---

## Erfolgs-Kriterien

- ✅ Admin kann Chat- und Analyse-Modelle separat konfigurieren
- ✅ 3-stufige Auswahl: Small, Medium, Large für beide Kontexte
- ✅ Keine Design-Änderung der API-Seite (nur neues Panel hinzugefügt)
- ✅ Abwärtskompatibel mit altem 2-stufigen Format
- ✅ Cache-Invalidierung funktioniert
- ✅ API-Usage zeigt korrekte Model-Namen in Stats

---

## Offene Fragen

- Sollen wir auch für Translation/Formatting separate Mappings haben?
  → **Entscheidung**: Nein, Formatting fällt unter "analysis", Translation unter "chat"

- Welche Default-Werte verwenden?
  → **Vorschlag**:
  - Chat: Flash=Small, Standard=Medium, Pro=Large
  - Analysis: Flash=Small, Standard=Medium, Pro=Large

