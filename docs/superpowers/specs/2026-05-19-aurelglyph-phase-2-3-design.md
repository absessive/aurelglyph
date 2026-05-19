# Aurelglyph Phase 2 And Phase 3 Design

## Goal

Ship Aurelglyph `0.3.0` as a broader starter UI kit across web, Rails, and SwiftUI. Phase 2 adds mobile/app controls. Phase 3 adds product/workbench controls. The result should be useful in Rails, React, CSS-only, and Swift projects with minimum setup.

## Scope

Phase 2 mobile/app controls:

- Navigation stack / page container
- Toolbar
- Modal/sheet
- Segmented control
- Select/menu
- Alert/banner
- Empty state
- Avatar
- Badge

Phase 3 product/workbench controls:

- Tabs
- Breadcrumbs
- Toast
- Progress
- Skeleton/loading
- Stats/metric cards
- Table
- Pagination
- Command palette

## Architecture

The CSS class contract is shared. React components render typed, accessible markup using `ag-*` classes. Rails helpers emit equivalent server-rendered markup. SwiftUI components expose native view types with the same naming and semantics where practical.

The React stylesheet remains the source for shared component class styling. The `@aurelglyph/css` and Rails generators continue to include that shared component layer so CSS-only and Rails consumers are not visually behind React consumers.

## Component Contract

Components should be starter-quality and reusable, not a full enterprise framework. They must support light/dark mode and accent themes through tokens. Focus states, labels, selected/current states, progress semantics, modal dialog semantics, and form labeling are part of the contract.

## Documentation

The release must update:

- `README.md`
- `CHANGELOG.md`
- `docs/consuming.md`
- Generated GitHub Pages HTML
- React Vite example app

## Testing

The release must add or update tests before commit:

- React export and component structure tests
- CSS/Rails generated component-class coverage tests
- Rails helper markup tests
- Swift component availability tests
- Pages generation test coverage if needed

## Release

Version should bump from `0.2.0` to `0.3.0`. Commit only after docs, tests, generated artifacts, and verification pass.
