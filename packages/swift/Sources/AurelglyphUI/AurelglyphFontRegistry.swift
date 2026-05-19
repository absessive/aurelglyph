import CoreGraphics
import CoreText
import Foundation

public enum AurelglyphFontRegistry {
  public struct RegistrationResult: Sendable {
    public let registeredPostScriptNames: [String]
    public let missingResources: [String]
    public let failures: [String]

    public var isReady: Bool {
      missingResources.isEmpty && failures.isEmpty
    }
  }

  public static let fontResourceNames = [
    "Newsreader-Regular",
    "Newsreader-Medium",
    "Newsreader-Bold",
    "IBMPlexSans-Regular",
    "IBMPlexSans-Medium",
    "IBMPlexSans-Bold",
    "IBMPlexSerif-Regular",
    "IBMPlexSerif-Medium",
    "IBMPlexSerif-Bold",
    "JetBrainsMono-Regular",
    "JetBrainsMono-Medium",
    "JetBrainsMono-Bold"
  ]

  public static let expectedPostScriptNames = [
    "Newsreader72pt-Regular",
    "Newsreader72pt-Medium",
    "Newsreader72pt-Bold",
    "IBMPlexSans",
    "IBMPlexSans-Medm",
    "IBMPlexSans-Bold",
    "IBMPlexSerif-Regular",
    "IBMPlexSerif-Medium",
    "IBMPlexSerif-Bold",
    "JetBrainsMono-Regular",
    "JetBrainsMono-Medium",
    "JetBrainsMono-Bold"
  ]

  @discardableResult
  public static func registerFonts() -> RegistrationResult {
    registrationResult
  }

  private static let registrationResult: RegistrationResult = {
    var registeredPostScriptNames: [String] = []
    var missingResources: [String] = []
    var failures: [String] = []

    for resourceName in fontResourceNames {
      guard let url = fontURL(for: resourceName) else {
        missingResources.append("\(resourceName).ttf")
        continue
      }

      var registrationError: Unmanaged<CFError>?
      let registered = CTFontManagerRegisterFontsForURL(url as CFURL, .process, &registrationError)
      let alreadyRegistered = registrationError
        .map { CFErrorGetCode($0.takeRetainedValue()) == CTFontManagerError.alreadyRegistered.rawValue } ?? false

      if registered || alreadyRegistered {
        if let postScriptName = postScriptName(for: url) {
          registeredPostScriptNames.append(postScriptName)
        }
      } else {
        failures.append(resourceName)
      }
    }

    return RegistrationResult(
      registeredPostScriptNames: registeredPostScriptNames,
      missingResources: missingResources,
      failures: failures
    )
  }()

  private static func postScriptName(for url: URL) -> String? {
    guard
      let provider = CGDataProvider(url: url as CFURL),
      let font = CGFont(provider),
      let postScriptName = font.postScriptName
    else {
      return nil
    }

    return postScriptName as String
  }

  private static func fontURL(for resourceName: String) -> URL? {
    Bundle.module.url(forResource: resourceName, withExtension: "ttf", subdirectory: "Fonts")
      ?? Bundle.module.url(forResource: resourceName, withExtension: "ttf")
  }
}
