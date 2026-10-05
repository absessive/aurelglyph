import SwiftUI
import Testing
@testable import AurelglyphUI

@Test func exposesCompactLocalizedMoreInformationDisclosure() {
  let information = AurelglyphMoreInformation(
    "Détails du formulaire",
    triggerLabel: "En savoir plus",
    closeLabel: "Fermer les détails"
  ) {
    Text("Contexte facultatif")
  }
  .aurelglyphTheme(.init(mode: .light, appearance: .quiet))

  #expect(String(describing: type(of: information)).contains("AurelglyphMoreInformation"))
}
