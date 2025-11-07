# Copilot / AI Agent Instructions — Gemini AI Text Toolkit

Be concise and prefer edits over suggestions. This repo is a small React + TypeScript single-page app that calls Google Gemini via a thin service layer. Below are the concrete patterns, conventions and hotspots you need to be productive.

1. Quick dev/run notes
   - Install and run: `npm install` then `npm run dev`. Vite serves on port 3000 by default.
   - The app expects a Gemini API key. Put GEMINI_API_KEY in `.env.local` (this repo's README calls out `.env.local`). Vite maps `process.env.GEMINI_API_KEY` and `process.env.API_KEY` in `vite.config.ts`.
   - If the API key is missing the app will throw when importing `services/geminiService.ts` (module-level check). Fix by setting the env var before starting.

2. Architecture / key boundaries
   - UI: `components/` — small, focused React functional components (e.g. `ChatBot.tsx`, `TextProcessor.tsx`, `ReplyStyleModal.tsx`). Follow their prop patterns and existing hooks.
   - Services: `services/geminiService.ts` — single place for all Gemini interactions. Use its exported functions (`getChatResponse`, `processText`, `resetChat`) when changing model behavior.
   - Translations: `i18n/locales.ts` + `contexts/LanguageContext.tsx` — `t(key)` returns a string; note one key (`chat.welcome.prompts`) is an array used in `ChatBot.tsx`.
   - Theme: `contexts/ThemeContext.tsx` persists a `theme` into `localStorage` and toggles the `dark` class on `document.documentElement`. `index.html` contains an initial inline script to avoid FOUC.

3. Code patterns & conventions to mirror
   - Centralized prompts: `constants.ts` exports `getPredefinedPrompts` and `getReplyStyles` which produce prompt objects by calling `t(...)`. Use these helpers to add or change prompts.
   - Service error behavior: service functions log errors and re-throw. UI components expect re-thrown errors and show user-facing messages (see `ChatBot.handleSend` and `TextProcessor.handleAction`). Preserve this pattern.
   - Feature flags / checks: components check browser capabilities (Web Speech API on `window.SpeechRecognition` and `navigator.clipboard.readText`) and degrade gracefully. Mirror this pattern when adding APIs.
   - Loading/disable pattern: UI uses an `isLoading` boolean to disable buttons/inputs and show spinner components (`common/Spinner.tsx`). Reuse rather than duplicate.

4. Integration points & gotchas
   - Gemini SDK: repo uses `@google/genai` in `services/geminiService.ts` and `@google/genai` appears in `package.json`. `index.html` also provides an importmap to CDN in AI Studio — be mindful of both patterns when debugging import/runtime issues.
   - Env var mapping: `vite.config.ts` sets `process.env.API_KEY` and `process.env.GEMINI_API_KEY`. The service checks `process.env.API_KEY`. Prefer setting GEMINI_API_KEY in `.env.local` as README instructs; Vite maps it automatically.
   - Module-level throws: `services/geminiService.ts` throws if the API key is absent. When running tests or static analysis, stub or set the env var to avoid import-time failures.
   - Service worker: `index.html` registers `sw.js`. Changes to the service worker may require unregistering old SWs in the browser during development.

5. Where to make changes
   - Add model or prompt variants: update `constants.ts` (prompts) and `services/geminiService.ts` (model selection/params).
   - UI changes: edit specific components under `components/` (they are small and self-contained). Use existing hooks `useTranslation()` and `useTheme()`.
   - I18n: add keys to `i18n/locales.ts`. `LanguageContext` falls back to English for missing keys — tests or UI changes should account for fallback behavior.

6. Debugging tips
   - If the app throws on import, check env var mapping in `vite.config.ts` and that `.env.local` contains `GEMINI_API_KEY`.
   - For runtime model issues, open DevTools -> Network and Console. `services/geminiService.ts` prints errors to console and re-throws so the UI will surface a friendly `t('...errorMessage')` string.
   - Voice/clipboard features are gated by capability checks. When testing in desktop Chrome, enable the microphone and permissions.

7. Minimal examples (copyable snippets)
   - Call the conversational API (use service wrapper):
     - `import { getChatResponse } from './services/geminiService'; const reply = await getChatResponse('Hello');`
   - Use a prompt from constants in the processor UI:
     - `import { getPredefinedPrompts } from './constants'; const prompts = getPredefinedPrompts(t);`

8. What not to change lightly
   - The shape of prompts returned by `getPredefinedPrompts` (id, label, prompt, optional isMenu/subActions) — many UI components rely on this structure.
   - `LanguageContext`'s fallback logic — tests/UX depend on fallback to `en` for missing keys.

If anything above is unclear or you'd like the instructions expanded with examples for a specific task (adding a new prompt, swapping models, or mocking Gemini for tests), tell me which area and I'll iterate. 
