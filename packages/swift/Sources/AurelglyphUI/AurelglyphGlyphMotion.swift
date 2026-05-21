import SwiftUI

public enum GlyphSpring: String, CaseIterable, Sendable {
  case quiet
  case standard
  case expressive
}

public enum GlyphTransition: String, CaseIterable, Sendable {
  case bloom
  case drift
  case collapse
  case glass
  case thread
  case tilt
  case arc
  case none
}

public enum GlyphState: String, CaseIterable, Sendable {
  case matched
  case presenting
  case dismissing
  case appearing
  case disappearing
}

public enum GlyphDirection: String, CaseIterable, Sendable {
  case up
  case down
  case leading
  case trailing
  case forward
  case back
}

public enum GlyphSnapshotStrategy: String, CaseIterable, Sendable {
  case live
  case optimized
  case layer
  case none
}

public struct GlyphInteractive: Equatable, Sendable {
  public enum Phase: String, Sendable {
    case idle
    case updating
    case finishing
    case cancelling
  }

  public let active: Bool
  public let progress: Double
  public let phase: Phase

  public init(progress: Double = 0, phase: Phase? = nil) {
    let clamped = min(1, max(0, progress))
    self.progress = clamped
    self.active = clamped > 0 && clamped < 1
    self.phase = phase ?? (clamped <= 0 ? .idle : clamped >= 1 ? .finishing : .updating)
  }
}

public struct GlyphMotionNamespace {
  public let id: Namespace.ID

  public init(_ id: Namespace.ID) {
    self.id = id
  }
}

public enum GlyphMotion {
  public static let quietSpringToken = AurelglyphTokens.motionSpringQuiet
  public static let standardSpringToken = AurelglyphTokens.motionSpringStandard
  public static let expressiveSpringToken = AurelglyphTokens.motionSpringExpressive

  public static func animation(_ spring: GlyphSpring = .standard) -> Animation {
    switch spring {
    case .quiet:
      return .spring(response: 0.28, dampingFraction: 0.92, blendDuration: 0.08)
    case .standard:
      return .spring(response: 0.36, dampingFraction: 0.86, blendDuration: 0.12)
    case .expressive:
      return .spring(response: 0.48, dampingFraction: 0.78, blendDuration: 0.16)
    }
  }
}

public extension View {
  func glyphMatch(_ id: String, in namespace: Namespace.ID) -> some View {
    matchedGeometryEffect(id: id, in: namespace)
  }

  func glyphTransition(_ transition: GlyphTransition, direction: GlyphDirection = .forward) -> some View {
    modifier(GlyphTransitionModifier(transition: transition, direction: direction))
  }

  func glyphSpring(_ spring: GlyphSpring = .standard) -> some View {
    animation(GlyphMotion.animation(spring), value: spring.rawValue)
  }
}

private struct GlyphTransitionModifier: ViewModifier {
  let transition: GlyphTransition
  let direction: GlyphDirection

  func body(content: Content) -> some View {
    content.transition(swiftUITransition)
  }

  private var swiftUITransition: AnyTransition {
    switch transition {
    case .bloom:
      return .opacity.combined(with: .scale(scale: 1.025))
    case .drift:
      return .move(edge: edge).combined(with: .opacity)
    case .collapse:
      return .scale(scale: 0.96).combined(with: .opacity)
    case .glass:
      return .opacity.combined(with: .scale(scale: 0.98))
    case .thread:
      return .opacity.combined(with: .move(edge: edge))
    case .tilt:
      return .scale(scale: 0.985).combined(with: .opacity)
    case .arc:
      return .move(edge: edge == .leading || edge == .trailing ? .bottom : edge).combined(with: .opacity)
    case .none:
      return .identity
    }
  }

  private var edge: Edge {
    switch direction {
    case .up:
      return .top
    case .down:
      return .bottom
    case .leading, .back:
      return .leading
    case .trailing, .forward:
      return .trailing
    }
  }
}
