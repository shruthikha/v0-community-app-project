source: requirement
imported_date: 2026-04-08
---
# Requirements: System-wide Rich Text Editor Fixes

## 1. Problem Statement
The application's Rich Text Editor (Tiptap) has two critical usability issues affecting multiple areas (e.g., Event Flagging, Description fields):
1.  **Input Blocking**: Users cannot type spaces in certain description fields (e.g., "Flag Event"). This typically indicates a conflict between the editor's internal state and a parent component's state management (e.g., aggressive trimming).
2.  **Invisible Formatting**: Users can create bullet points and numbered lists, but they are not visible in the rendered output. This suggests a CSS/styling issue where list markers are suppressed or hidden.

## 2. User Persona
-   **Resident/Admin**: Wants to write clear, formatted descriptions for events, flags, and other content without fighting the interface.
-   **User**: Expects standard text editing behavior (spaces work, lists look like lists).

## 3. Context
-   **Component**: `components/ui/rich-text-editor.tsx` wrapping Tiptap.
-   **Tech Stack**: Tiptap (React), Tailwind CSS (`prose` plugin), Shadcn UI.
-   **Affected Areas**:
    -   Flag Event Modal (Description field)
    -   Event Creation/Edit (Description field)
    -   Any other form using `RichTextEditor` controlled components.

## 4. Dependencies
-   `components/ui/rich-text-editor.tsx`
-   Global CSS / Tailwind config (for list styles)
-   Form schemas (Zod) or state handlers (React Hook Form) that might be trimming inputs.

## 5. Technical Options

### Option 1: Component Logic Fixes (Recommended)
Modify `RichTextEditor.tsx` to handle the value synchronization more gracefully and enforce missing styles.
-   **Space Issue**: Update the `useEffect` hook to prevent overwriting local state if the difference is only a trailing space or cursor position issues.
    -   *Detail*: The current `useEffect` blindly calls `commands.setContent()` whenever `value` prop changes. If the parent component (e.g. strict Zod schema) trims the value on every keystroke, typing a space triggers `onChange("text ")` -> parent sets state to `"text"` -> `value` becomes `"text"` -> `useEffect` sees mismatch -> `setContent("text")` -> space is lost.
    -   *Fix*: Add a check to ignore updates if the content is semantically identical or if the user is actively typing (though `value` sync is tricky). Better: Fix the parent schemas. BUT, Option 1 here assumes we fix the *Editor* to be robust against this by local buffering.
-   **List Issue**: Add specific Tailwind classes to the `editorProps.attributes.class`.
    -   *Detail*: Add `[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5` to ensures lists are visible regardless of global resets.
-   **Pros**: Centralized fix. Robust.
-   **Cons**: Slightly more complex component logic.
-   **Effort**: XS (1-2 hours)

### Option 2: Global Schema & CSS Update
Fix the consumers of the component rather than the component itself.
-   **Space Issue**: Audit all 50+ Zod schemas in the app and remove `.trim()` from any field using the RTE.
-   **List Issue**: Update `globals.css` to force list styles on `.ProseMirror` class.
-   **Pros**: Keeps component simple.
-   **Cons**: High risk of regression (missing a schema). Maintenance burden (must remember not to trim in future). Global CSS might have side effects.
-   **Effort**: M (Audit required)

### Option 3: Uncontrolled Component Mode
Switch `RichTextEditor` to use an uncontrolled pattern `defaultValue` instead of `value`.
-   **Space Issue**: The editor manages its own state entirely. `onChange` propagates up, but the parent never pushes back down (except maybe on form reset).
-   **List Issue**: Same as Option 1 (CSS classes).
-   **Pros**: Eliminates the "fighting" between parent and child state.
-   **Cons**: Harder to implement specific features like "Clear Form" or external updates without using ref/imperative handles.
-   **Effort**: S (Refactor required)

## 6. Recommendation

**Option 1: Component Logic Fixes** is recommended.

### Justification
This approach fixes the issue at the source (`RichTextEditor`) ensuring it works correctly regardless of how parent forms are configured. It avoids the high risk of missing a schema in a global audit (Option 2) and preserves the controlled component pattern which is standard in this codebase (unlike Option 3).

### Classification
-   **Priority**: P1 (Bugfix - impediments to basic data entry)
-   **Size**: XS (Component-level fix)
-   **Horizon**: Sprint 3




## 8. Technical Review

### Phase 0: Context Gathering
- **Issue**: #110 (Rich Text Editor - Spaces blocked & Lists invisible).
- **Impact Map**:
    - **Core Component**: `components/ui/rich-text-editor.tsx`
    - **Consumers**:
        - `components/exchange/create-listing-steps/step-2-basic-info.tsx`
        - `components/exchange/edit-exchange-listing-modal.tsx`
- **History**:
    - `a538847` (2025-12-08): Minor fixes for alpha (likely stable since then)
    - `6922836` (2025-11-29): Redesign migration
    - `96f5c7e` (2025-11-09): Initial implementation
    - **Insight**: Component is relatively stable (2+ months without changes). Issues likely stem from integration (parent state) or CSS global resets rather than recent regressions in the component itself.

### Phase 1: Vibe & Security Audit
- **Vibe Check**:
    - Component uses standard Tiptap implementation.
    - `use client` directive is correct.
    - Clean code structure, though `useEffect` synchronization is suspicious (potential feedback loop).
- **Attack Surface**:
    - **Input**: `value` prop (HTML string).
    - **Output**: `onChange` (HTML string).
    - **Rendering**: Consumers (`ExchangeListingDetailModal`) use `dangerouslySetInnerHTML`.
    - **Risk**: Stored XSS. Tiptap provides default sanitization, but we rely on client-side protection.
    - **Recommendation**: Ensure `description` is sanitized on the server (Zod) or before rendering if possible. For now, Tiptap's default schema is likely sufficient for standard usage, but explicit sanitization is preferred.

### Phase 2: Test Strategy
- **Sad Paths**:
    - **Trailing Space**: Type "Hello " (with space) -> Check if space persists.
    - **Mixed Content**: Lists inside Blockquotes.
    - **Paste**: Paste styled text from external source (e.g., Google Docs).
    - **XSS Injection**: Input `<script>alert(1)</script>` -> Save -> View.
- **Test Plan (Manual)**:
    1.  **Space Test**: Go to "Create Listing" -> Description -> Type "Test " -> Wait 1s -> Type "More".
    2.  **List Test**: Create a Bullet List and Numbered List. Verify indentation and bullets are visible in Editor.
    3.  **Render Test**: Save Listing -> Open Details Modal -> Verify Lists are visible (bullets/numbers present).
    4.  **Edit Test**: Re-open Edit Modal -> Verify state is preserved (spaces/lists intact).

### Phase 3: Performance Assessment
- **Schema Analysis**: `exchange_listings.description` is a `TEXT` field in Supabase with no size constraints in the migration.
- **Code Audit**: `.trim()` calls found in `handleSubmit` and `handleSubmitListing` in both Create and Edit modals.
- **Root Cause Hypothesis**: The space-blocking is likely caused by aggressive state trimming in parent components or a feedback loop in the `RichTextEditor` controlled component logic.

### Phase 5:- **Status**: [Ready for Development]
- **Sizing**: XS
- **Priority**: P1 - Functional Bug localized to `RichTextEditor.tsx` and one modal.
- **Strategic Impact**: Essential for community trust. Broken input is a high-friction user experience issue.
- **Verification Result**: The issue is confirmed as a structural bug in the controlled component implementation.

## Implementation Recommendation

### 1. Fix Space Blocking (RichTextEditor.tsx)
Modify the `useEffect` that synchronizes `value` to the editor. instead of blindly checking `value !== editor.getHTML()`, use a more robust comparison or only sync when the editor is NOT focused.
```typescript
useEffect(() => {
  if (editor && value !== undefined && value !== null) {
    if (editor.isFocused) return; // Don't wipe state while typing
    const currentContent = editor.getHTML()
    if (value !== currentContent) {
      editor.commands.setContent(value || '', false) // false to not emit update
    }
  }
}, [value, editor])
```

### 2. Fix List Visibility (RichTextEditor.tsx)
Add explicit Tailwind classes for lists in `editorProps.attributes.class`:
```typescript
"[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
```

### 3. Security Hardening (ExchangeListingDetailModal.tsx)
Wrap the content in `DOMPurify` (or similar) before rendering with `dangerouslySetInnerHTML`.
- **Root Cause (Logic)**:
    - Found `.trim()` calls in `handleSubmit` and `handleSubmitListing` in both Create/Edit modals.
    - **Hypothesis**: The space blocking might occur if `value.trim()` is applied during state updates in a parent component, causing the trailing space to be removed before it's passed back to the Editor.
