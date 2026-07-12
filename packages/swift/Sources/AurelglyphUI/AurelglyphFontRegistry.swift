import CoreText
import Foundation

public enum AurelglyphFontRegistry {
  public struct RegistrationResult: Sendable {
    public let registeredPostScriptNames: [String]
    public let missingResources: [String]
    public let failures: [String]

    public var isReady: Bool {
      missingResources.isEmpty
        && failures.isEmpty
        && Set(registeredPostScriptNames) == Set(AurelglyphFontRegistry.expectedPostScriptNames)
    }

    public func contains(postScriptName: String) -> Bool {
      registeredPostScriptNames.contains(postScriptName)
    }
  }

  private static let fontResources: [(resourceName: String, postScriptNames: [String])] = [
    (
      "LibreBaskerville-Regular",
      [
        "LibreBaskerville-Regular",
        "LibreBaskerville-Medium",
        "LibreBaskerville-SemiBold",
        "LibreBaskerville-Bold"
      ]
    ),
    ("AtkinsonHyperlegible-Regular", ["AtkinsonHyperlegible-Regular"]),
    ("AtkinsonHyperlegible-Bold", ["AtkinsonHyperlegible-Bold"]),
    ("SpaceMono-Regular", ["SpaceMono-Regular"]),
    ("SpaceMono-Bold", ["SpaceMono-Bold"])
  ]

  public static let fontResourceNames = fontResources.map(\.resourceName)
  public static let expectedPostScriptNames = fontResources.flatMap(\.postScriptNames)

  @discardableResult
  public static func registerFonts() -> RegistrationResult {
    registrationResult
  }

  private static let registrationResult: RegistrationResult = {
    var registeredPostScriptNames: [String] = []
    var missingResources: [String] = []
    var failures: [String] = []

    for resource in fontResources {
      let resourceName = resource.resourceName
      guard let url = fontURL(for: resourceName) else {
        missingResources.append("\(resourceName).ttf")
        continue
      }

      var registrationError: Unmanaged<CFError>?
      let registered = CTFontManagerRegisterFontsForURL(url as CFURL, .process, &registrationError)
      let alreadyRegistered = registrationError
        .map { CFErrorGetCode($0.takeRetainedValue()) == CTFontManagerError.alreadyRegistered.rawValue } ?? false

      if registered || alreadyRegistered {
        let postScriptNames = postScriptNames(for: url)
        if Set(postScriptNames) == Set(resource.postScriptNames) {
          registeredPostScriptNames.append(contentsOf: postScriptNames)
        } else {
          failures.append("\(resourceName): unexpected PostScript names")
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

  private static func postScriptNames(for url: URL) -> [String] {
    let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor] ?? []
    return descriptors.compactMap { descriptor in
      CTFontDescriptorCopyAttribute(descriptor, kCTFontNameAttribute) as? String
    }
  }

  private static func fontURL(for resourceName: String) -> URL? {
    Bundle.module.url(forResource: resourceName, withExtension: "ttf", subdirectory: "Fonts")
      ?? Bundle.module.url(forResource: resourceName, withExtension: "ttf")
  }
}
