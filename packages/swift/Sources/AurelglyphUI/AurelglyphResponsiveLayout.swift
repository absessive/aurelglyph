import SwiftUI

/// Shared responsive constants and decisions used by Aurelglyph controls.
enum AurelglyphResponsiveLayout {
  static let minimumInteractiveDimension: CGFloat = 44
  static let defaultNavigationWidth: CGFloat = 260
  static let minimumRegularContentWidth: CGFloat = 320
  static let navigationDividerWidth: CGFloat = 1

  static func prefersStackedLayout(for dynamicTypeSize: DynamicTypeSize) -> Bool {
    dynamicTypeSize.isAccessibilitySize
  }

  static func navigationWidth(_ proposedWidth: CGFloat) -> CGFloat {
    guard proposedWidth.isFinite else { return defaultNavigationWidth }
    return max(proposedWidth, minimumInteractiveDimension)
  }

  static func usesRegularNavigation(
    availableWidth: CGFloat,
    navigationWidth: CGFloat,
    isCompactWidth: Bool
  ) -> Bool {
    guard availableWidth.isFinite, !isCompactWidth else { return false }
    return availableWidth
      >= navigationWidth + navigationDividerWidth + minimumRegularContentWidth
  }
}

/// Selects between two layouts without duplicating the consumer's subview tree.
struct AurelglyphAdaptiveLayout: Layout {
  struct Cache {
    var primary: AnyLayout.Cache
    var fallback: AnyLayout.Cache?
    var usesFallback: Bool
  }

  let primary: AnyLayout
  let fallback: AnyLayout?
  let fittingAxis: Axis
  let forceFallback: Bool

  func makeCache(subviews: Subviews) -> Cache {
    Cache(
      primary: primary.makeCache(subviews: subviews),
      fallback: fallback?.makeCache(subviews: subviews),
      usesFallback: forceFallback && fallback != nil
    )
  }

  func updateCache(_ cache: inout Cache, subviews: Subviews) {
    cache.primary = primary.makeCache(subviews: subviews)
    cache.fallback = fallback?.makeCache(subviews: subviews)
    cache.usesFallback = forceFallback && fallback != nil
  }

  func sizeThatFits(
    proposal: ProposedViewSize,
    subviews: Subviews,
    cache: inout Cache
  ) -> CGSize {
    cache.usesFallback = shouldUseFallback(
      proposal: proposal,
      subviews: subviews,
      cache: &cache
    )
    return selectedSize(proposal: proposal, subviews: subviews, cache: &cache)
  }

  func placeSubviews(
    in bounds: CGRect,
    proposal: ProposedViewSize,
    subviews: Subviews,
    cache: inout Cache
  ) {
    let boundsProposal = ProposedViewSize(width: bounds.width, height: bounds.height)
    cache.usesFallback = shouldUseFallback(
      proposal: boundsProposal,
      subviews: subviews,
      cache: &cache
    )

    if cache.usesFallback, let fallback, var fallbackCache = cache.fallback {
      fallback.placeSubviews(
        in: bounds,
        proposal: proposal,
        subviews: subviews,
        cache: &fallbackCache
      )
      cache.fallback = fallbackCache
    } else {
      primary.placeSubviews(
        in: bounds,
        proposal: proposal,
        subviews: subviews,
        cache: &cache.primary
      )
    }
  }

  private func shouldUseFallback(
    proposal: ProposedViewSize,
    subviews: Subviews,
    cache: inout Cache
  ) -> Bool {
    guard fallback != nil else { return false }
    guard !forceFallback else { return true }

    var measurementProposal = proposal
    let availableDimension: CGFloat?
    switch fittingAxis {
    case .horizontal:
      availableDimension = proposal.width
      measurementProposal.width = nil
    case .vertical:
      availableDimension = proposal.height
      measurementProposal.height = nil
    }

    guard let availableDimension else { return false }
    let primarySize = primary.sizeThatFits(
      proposal: measurementProposal,
      subviews: subviews,
      cache: &cache.primary
    )
    let requestedDimension = fittingAxis == .horizontal ? primarySize.width : primarySize.height
    return requestedDimension > availableDimension
  }

  private func selectedSize(
    proposal: ProposedViewSize,
    subviews: Subviews,
    cache: inout Cache
  ) -> CGSize {
    if cache.usesFallback, let fallback, var fallbackCache = cache.fallback {
      let size = fallback.sizeThatFits(
        proposal: proposal,
        subviews: subviews,
        cache: &fallbackCache
      )
      cache.fallback = fallbackCache
      return size
    }

    return primary.sizeThatFits(
      proposal: proposal,
      subviews: subviews,
      cache: &cache.primary
    )
  }
}

/// Keeps leading identity content and trailing actions in one subtree while
/// moving actions below when the horizontal arrangement no longer fits.
struct AurelglyphAdaptiveHeaderLayout: Layout {
  let leadingItemCount: Int
  let primarySpacing: CGFloat
  let trailingSpacing: CGFloat
  let fallbackSpacing: CGFloat
  let forceFallback: Bool
  let layoutDirection: LayoutDirection

  func sizeThatFits(
    proposal: ProposedViewSize,
    subviews: Subviews,
    cache: inout Void
  ) -> CGSize {
    let primarySizes = subviews.map { $0.sizeThatFits(.unspecified) }
    guard usesFallback(
      availableWidth: proposal.width,
      primarySizes: primarySizes,
      subviewCount: subviews.count
    ) else {
      return CGSize(
        width: proposal.width ?? primaryWidth(primarySizes),
        height: primarySizes.map(\.height).max() ?? 0
      )
    }

    let sizes = fallbackSizes(availableWidth: proposal.width, subviews: subviews)
    return CGSize(
      width: proposal.width ?? fallbackWidth(sizes),
      height: fallbackHeight(sizes)
    )
  }

  func placeSubviews(
    in bounds: CGRect,
    proposal: ProposedViewSize,
    subviews: Subviews,
    cache: inout Void
  ) {
    let primarySizes = subviews.map { $0.sizeThatFits(.unspecified) }
    if usesFallback(
      availableWidth: bounds.width,
      primarySizes: primarySizes,
      subviewCount: subviews.count
    ) {
      placeFallback(in: bounds, subviews: subviews)
    } else {
      placePrimary(in: bounds, sizes: primarySizes, subviews: subviews)
    }
  }

  private func usesFallback(
    availableWidth: CGFloat?,
    primarySizes: [CGSize],
    subviewCount: Int
  ) -> Bool {
    guard !forceFallback, let availableWidth else { return forceFallback }
    guard subviewCount > 0 else { return false }
    return primaryWidth(primarySizes) > availableWidth
  }

  private func primaryWidth(_ sizes: [CGSize]) -> CGFloat {
    let leadingCount = resolvedLeadingCount(for: sizes.count)
    let leadingWidth = summedWidth(sizes.prefix(leadingCount), spacing: primarySpacing)
    let trailingWidth = summedWidth(sizes.dropFirst(leadingCount), spacing: trailingSpacing)
    let groupSpacing = leadingCount > 0 && sizes.count > leadingCount ? primarySpacing : 0
    return leadingWidth + groupSpacing + trailingWidth
  }

  private func fallbackSizes(
    availableWidth: CGFloat?,
    subviews: Subviews
  ) -> [CGSize] {
    let leadingCount = resolvedLeadingCount(for: subviews.count)
    var sizes: [CGSize] = []
    var consumedLeadingWidth: CGFloat = 0

    for index in subviews.indices {
      let proposedWidth: CGFloat?
      if index < leadingCount {
        if index == leadingCount - 1, let availableWidth {
          let precedingSpacing = primarySpacing * CGFloat(max(leadingCount - 1, 0))
          proposedWidth = max(availableWidth - consumedLeadingWidth - precedingSpacing, 0)
        } else {
          proposedWidth = nil
        }
      } else {
        proposedWidth = availableWidth
      }

      let size = subviews[index].sizeThatFits(
        ProposedViewSize(width: proposedWidth, height: nil)
      )
      sizes.append(size)
      if index < leadingCount - 1 {
        consumedLeadingWidth += size.width
      }
    }
    return sizes
  }

  private func fallbackWidth(_ sizes: [CGSize]) -> CGFloat {
    let leadingCount = resolvedLeadingCount(for: sizes.count)
    let leadingWidth = summedWidth(sizes.prefix(leadingCount), spacing: primarySpacing)
    let trailingWidth = sizes.dropFirst(leadingCount).map(\.width).max() ?? 0
    return max(leadingWidth, trailingWidth)
  }

  private func fallbackHeight(_ sizes: [CGSize]) -> CGFloat {
    let leadingCount = resolvedLeadingCount(for: sizes.count)
    let leadingHeight = sizes.prefix(leadingCount).map(\.height).max() ?? 0
    let trailingSizes = sizes.dropFirst(leadingCount)
    let trailingHeight = trailingSizes.map(\.height).reduce(0, +)
      + trailingSpacing * CGFloat(max(trailingSizes.count - 1, 0))
    let groupSpacing = leadingCount > 0 && !trailingSizes.isEmpty ? fallbackSpacing : 0
    return leadingHeight + groupSpacing + trailingHeight
  }

  private func placePrimary(
    in bounds: CGRect,
    sizes: [CGSize],
    subviews: Subviews
  ) {
    let leadingCount = resolvedLeadingCount(for: subviews.count)
    let rowHeight = sizes.map(\.height).max() ?? 0
    let trailingSizes = sizes.dropFirst(leadingCount)
    if layoutDirection == .rightToLeft {
      var leadingX = bounds.maxX
      for index in 0..<leadingCount {
        let size = sizes[index]
        leadingX -= size.width
        place(
          subviews[index],
          atX: leadingX,
          rowY: bounds.minY,
          rowHeight: rowHeight,
          size: size
        )
        leadingX -= primarySpacing
      }

      var trailingX = bounds.minX + summedWidth(trailingSizes, spacing: trailingSpacing)
      for index in leadingCount..<subviews.count {
        let size = sizes[index]
        trailingX -= size.width
        place(
          subviews[index],
          atX: trailingX,
          rowY: bounds.minY,
          rowHeight: rowHeight,
          size: size
        )
        trailingX -= trailingSpacing
      }
    } else {
      var leadingX = bounds.minX
      for index in 0..<leadingCount {
        let size = sizes[index]
        place(
          subviews[index],
          atX: leadingX,
          rowY: bounds.minY,
          rowHeight: rowHeight,
          size: size
        )
        leadingX += size.width + primarySpacing
      }

      var trailingX = bounds.maxX - summedWidth(trailingSizes, spacing: trailingSpacing)
      for index in leadingCount..<subviews.count {
        let size = sizes[index]
        place(
          subviews[index],
          atX: trailingX,
          rowY: bounds.minY,
          rowHeight: rowHeight,
          size: size
        )
        trailingX += size.width + trailingSpacing
      }
    }
  }

  private func placeFallback(in bounds: CGRect, subviews: Subviews) {
    let sizes = fallbackSizes(availableWidth: bounds.width, subviews: subviews)
    let leadingCount = resolvedLeadingCount(for: subviews.count)
    let leadingHeight = sizes.prefix(leadingCount).map(\.height).max() ?? 0
    var leadingX = layoutDirection == .rightToLeft ? bounds.maxX : bounds.minX

    for index in 0..<leadingCount {
      let size = sizes[index]
      if layoutDirection == .rightToLeft {
        leadingX -= size.width
      }
      subviews[index].place(
        at: CGPoint(x: leadingX, y: bounds.minY),
        anchor: .topLeading,
        proposal: ProposedViewSize(size)
      )
      leadingX += layoutDirection == .rightToLeft
        ? -(primarySpacing)
        : size.width + primarySpacing
    }

    var trailingY = bounds.minY + leadingHeight
    if leadingCount > 0 && subviews.count > leadingCount {
      trailingY += fallbackSpacing
    }
    for index in leadingCount..<subviews.count {
      let size = sizes[index]
      let trailingX = layoutDirection == .rightToLeft
        ? bounds.minX
        : bounds.maxX - size.width
      subviews[index].place(
        at: CGPoint(x: trailingX, y: trailingY),
        anchor: .topLeading,
        proposal: ProposedViewSize(size)
      )
      trailingY += size.height + trailingSpacing
    }
  }

  private func place(
    _ subview: LayoutSubview,
    atX x: CGFloat,
    rowY: CGFloat,
    rowHeight: CGFloat,
    size: CGSize
  ) {
    subview.place(
      at: CGPoint(x: x, y: rowY + (rowHeight - size.height) / 2),
      anchor: .topLeading,
      proposal: ProposedViewSize(size)
    )
  }

  private func resolvedLeadingCount(for totalCount: Int) -> Int {
    min(max(leadingItemCount, 0), totalCount)
  }

  private func summedWidth<S: Collection>(_ sizes: S, spacing: CGFloat) -> CGFloat
  where S.Element == CGSize {
    sizes.map(\.width).reduce(0, +) + spacing * CGFloat(max(sizes.count - 1, 0))
  }
}
