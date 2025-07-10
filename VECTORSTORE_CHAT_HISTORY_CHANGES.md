# Vectorstore-Specific Chat History Implementation

## Overview
Updated the chat history persistence system to tie chat history to specific vectorstore names, ensuring that each vectorstore maintains its own separate chat history in localStorage.

## Changes Made

### 1. Updated `usePersistentChat` Hook (`src/hooks/usePersistentChat.ts`)

**Key Changes:**
- Added `vectorStoreName` parameter with default value `'memories'`
- Changed storage key from static `'memory-chat-history'` to dynamic `'memory-chat-history-{vectorStoreName}'`
- Updated all localStorage operations to use the vectorstore-specific key
- Enhanced logging to include vectorstore name for better debugging

**Function Signature:**
```typescript
export function usePersistentChat(vectorStoreName: string = 'memories')
```

**Storage Key Format:**
```typescript
const chatStorageKey = `${CHAT_STORAGE_KEY_PREFIX}-${vectorStoreName}`
// Examples:
// - 'memory-chat-history-memories'
// - 'memory-chat-history-travel_agent_memory'
// - 'memory-chat-history-retail_agent_memory'
```

### 2. Updated API Pages

Updated all API pages to pass the current vectorstore name to `usePersistentChat`:

- **`src/app/save/page.tsx`**: Pass `settings.vectorStoreName`
- **`src/app/ask/page.tsx`**: Pass `settings.vectorStoreName`
- **`src/app/search/page.tsx`**: Pass `settings.vectorStoreName`
- **`src/app/recall/page.tsx`**: Pass `settings.vectorStoreName`
- **`src/app/memory-info/page.tsx`**: Pass `settings.vectorStoreName`

**Example Usage:**
```typescript
const { settings } = useSettings()
const {
    conversations,
    addConversation,
    clearChatHistory,
} = usePersistentChat(settings.vectorStoreName)
```

## Benefits

### 1. **Isolated Chat History**
Each vectorstore now maintains completely separate chat history:
- `memories` vectorstore has its own chat history
- `travel_agent_memory` vectorstore has its own chat history
- `retail_agent_memory` vectorstore has its own chat history
- Custom vectorstores automatically get their own isolated history

### 2. **Seamless Switching**
When users switch between vectorstores using the VectorStoreSelector:
- Chat history automatically loads for the selected vectorstore
- Previous conversations are preserved and restored
- No cross-contamination between different vectorstore contexts

### 3. **Backward Compatibility**
- Default parameter ensures existing code continues to work
- Legacy chat history (if any) remains accessible under the default `'memories'` vectorstore

### 4. **Clear History Per Vectorstore**
The "Clear History" button now only clears chat history for the currently selected vectorstore, preserving history for other vectorstores.

## Technical Implementation Details

### Storage Structure
Each vectorstore gets its own localStorage entry:
```
localStorage:
├── memory-chat-history-memories
├── memory-chat-history-travel_agent_memory
├── memory-chat-history-retail_agent_memory
└── memory-chat-history-investment_agent_memory
```

### Data Format
Each entry maintains the same structure:
```json
{
  "version": "1.0",
  "data": {
    "conversations": [...],
    "memorySaveResponses": [...],
    "recallResponses": [...],
    "searchResponses": [...],
    "lastUpdated": "2025-01-09T..."
  },
  "savedAt": "2025-01-09T..."
}
```

### Automatic Loading
When a component mounts or the vectorstore changes:
1. The hook automatically loads chat history for the specified vectorstore
2. If no history exists, it starts with empty arrays
3. All subsequent operations (save, clear, etc.) operate on the vectorstore-specific history

## Testing

A test file `test-vectorstore-chat-history.html` has been created to verify:
- ✅ Correct storage key generation
- ✅ Isolated chat history between vectorstores
- ✅ Selective clearing of specific vectorstore history
- ✅ localStorage inspection capabilities

## Usage Examples

### API Pages
```typescript
// In any API page component
const { settings } = useSettings()
const { conversations, addConversation } = usePersistentChat(settings.vectorStoreName)

// Chat history is automatically tied to the current vectorstore
```

### Demo Pages (if needed)
```typescript
// For demo pages that want specific vectorstore history
const { conversations } = usePersistentChat('travel_agent_memory')
```

### Settings/Admin Pages
```typescript
// For pages that manage multiple vectorstores
const memoriesHistory = usePersistentChat('memories')
const travelHistory = usePersistentChat('travel_agent_memory')
```

## Migration Notes

- **No breaking changes**: Existing code continues to work with default vectorstore
- **Automatic migration**: No manual data migration required
- **Gradual adoption**: Components can be updated incrementally to use specific vectorstores
