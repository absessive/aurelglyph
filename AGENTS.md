# AGENTS.md

## Scope

These instructions apply to the Aurelglyph design-system workspace.

## Project Goal

Aurelglyph is a standalone, versioned UX design language and component system
for SwiftUI, React, React Native, and Ruby on Rails apps. It uses a token-first
architecture with platform-specific adapters and examples.

## Working Guidelines

- Prefer the approved design spec before introducing new patterns.
- Keep changes focused on the current task.
- Do not revert user changes unless explicitly asked.
- Read relevant files before editing.
- Use `rg` for searching when available.
- Use `apply_patch` for manual file edits.
- Keep generated artifacts reproducible from the canonical token source.

## Delivery Steps

- Identify the relevant test command before code changes when a test framework
  exists.
- Add or update tests for behavior changes.
- Run the narrowest relevant checks after implementation.
- Ask a QA agent to review changes that affect user-visible behavior, shared
  logic, data handling, generated artifacts, package contracts, or regression-
  prone code.
- Address QA findings before final handoff, or explain why a finding was not
  acted on.

## Design-System Rules

- The token source is canonical; platform outputs should be generated from it.
- Platform packages should feel native while preserving shared naming,
  semantics, variants, states, and accessibility expectations.
- Core controls should use stable icon names and vector/system icons, not emoji.
- Emojis may be used only as content accents, status labels, examples, or
  expressive-mode details.
- Accessibility is part of the component contract, not a later polish pass.

## Verification

- Start with targeted unit tests for token generation or package behavior.
- Run package-level builds when changing public exports.
- Run visual or accessibility checks when changing components or styles.
- If checks cannot be run, explain why in the final response.

## Communication

- Summarize changed files and verification performed.
- Call out assumptions, skipped checks, and follow-up work clearly.
