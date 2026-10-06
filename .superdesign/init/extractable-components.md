# Extractable component menu

This component-expansion design is a self-contained primitive specimen board, not a redesign of the gallery shell. No gallery shell extraction is needed. Existing source layouts are available below for reuse if the composition later needs them. Extract only state/navigation values, never turn every visual detail into a draft prop. Source implementations are in `components.md` and `layouts.md`.

## AppShell

- Source: `packages/react/src/components/AppShell.tsx`
- Category: layout
- Description: Responsive shell around consumer navigation and content.
- Extractable props: No fixed navigation-state props; extract only visibility of existing navigation/topBar/footer slots if the target uses them.
- Hardcoded: ag-app-shell structure/classes; slot contents/icons/text belong to selected specimen.

## TopBar

- Source: `packages/react/src/components/TopBar.tsx`
- Category: layout
- Description: Shared header/title/action arrangement.
- Extractable props: No state or URLs; showActions/showLeading only if selected composition needs visibility.
- Hardcoded: Title/subtitle text, icons, heading choice, ag-top-bar classes.

## TabBar

- Source: `packages/react/src/components/TabBar.tsx`
- Category: layout
- Description: Anchor navigation with current-page state.
- Extractable props: activeId; item href URLs for target navigation.
- Hardcoded: Item labels/icon names, nav accessible label, ag-tab-bar classes.

## NavigationStack

- Source: `packages/react/src/components/NavigationStack.tsx`
- Category: layout
- Description: Stacked section/page presentation.
- Extractable props: None; no application navigation state exists in this primitive.
- Hardcoded: Title, heading hierarchy, ag-nav-stack/ag-nav-page classes.

## Toolbar

- Source: `packages/react/src/components/Toolbar.tsx`
- Category: layout
- Description: Named group of controls.
- Extractable props: Control availability/loading states only on selected child controls.
- Hardcoded: Toolbar label, button labels/icons, ag-toolbar classes.

## Surface

- Source: `packages/react/src/components/Layout.tsx`
- Category: layout
- Description: Flat/raised/floating tokenized surface.
- Extractable props: None.
- Hardcoded: elevation/padding configuration, classes, child content.

## Stack

- Source: `packages/react/src/components/Layout.tsx`
- Category: layout
- Description: Tokenized flex grouping.
- Extractable props: None.
- Hardcoded: direction/gap/align/justify/wrap, classes.

## Container

- Source: `packages/react/src/components/Layout.tsx`
- Category: layout
- Description: Readable width wrapper.
- Extractable props: None.
- Hardcoded: size, classes.

## Grid

- Source: `packages/react/src/components/Layout.tsx`
- Category: layout
- Description: Responsive baseline grid.
- Extractable props: None.
- Hardcoded: responsive columns, gap, minItemWidth, classes.

## Button

- Source: `packages/react/src/components/Button.tsx`
- Category: basic
- Description: Variants and busy/loading affordances.
- Extractable props: disabled, busy, loading.
- Hardcoded: variant, icon/name, label/content, ag-button classes.

## IconButton

- Source: `packages/react/src/components/IconButton.tsx`
- Category: basic
- Description: Labeled icon-only physical control.
- Extractable props: disabled, busy, loading.
- Hardcoded: icon, accessible label, variant, classes.

## Card

- Source: `packages/react/src/components/Card.tsx`
- Category: basic
- Description: Reusable module surface.
- Extractable props: None.
- Hardcoded: title, eyebrow, child specimen, classes.

## Badge

- Source: `packages/react/src/components/Badge.tsx`
- Category: basic
- Description: Inline semantic status.
- Extractable props: Visibility only if specimen needs showBadge.
- Hardcoded: tone, status copy, classes.

## TextField

- Source: `packages/react/src/components/TextField.tsx`
- Category: basic
- Description: Linked label/help/error input.
- Extractable props: value, disabled, readOnly, invalid, busy, loading.
- Hardcoded: label/name/id, placeholder, help/error copy, type and classes.

## RadioGroup

- Source: `packages/react/src/components/RadioGroup.tsx`
- Category: basic
- Description: Labeled option group.
- Extractable props: value, disabled, readOnly, invalid, loading; per-option disabled.
- Hardcoded: options' labels/descriptions, orientation, name, classes.

## ExpandableSection

- Source: `packages/react/src/components/ExpandableSection.tsx`
- Category: basic
- Description: Single accessible disclosure.
- Extractable props: open.
- Hardcoded: title, eyebrow, panel content, icon names/classes.

## Planned specimens (not yet source extractables)

Link, Chip, PasswordField, InputGroup, ValidationSummary, Accordion, Stepper, Rating. Match ag-* naming, quiet/atelier token contracts, native-adapter semantics, state/read-only/disabled behavior, and existing curated icons. Do not present planned components as shipped API.
