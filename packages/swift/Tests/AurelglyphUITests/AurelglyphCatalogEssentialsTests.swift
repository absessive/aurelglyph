import Foundation
import SwiftUI
import Testing
@testable import AurelglyphUI

@Test func exposesNativeCatalogEssentialsWithBindingsAndLocalState() {
  let text = Binding.constant("Draft")
  let selected = Binding.constant(true)
  let link = AurelglyphLink("Documentation", destination: URL(string: "https://example.com"), isExternal: true)
  let unavailable = AurelglyphLink("Unavailable", destination: URL(string: "https://example.com"), isDisabled: true)
  let chip = AurelglyphChip("Local", isSelected: selected, onRemove: {})
  let localChip = AurelglyphChip("Local", defaultSelected: true)
  let password = AurelglyphPasswordField("Password", text: text, purpose: .newPassword, isReadOnly: true)
  let group = AurelglyphInputGroup("Amount", text: text, prefix: "$", suffix: "USD", unitDescription: "US dollars")
  let actionGroup = AurelglyphInputGroup("Query", text: text, leading: { Image(systemName: "magnifyingglass") },
    trailing: { Button("Search") {} })
  let summary = AurelglyphValidationSummary(issues: [.init(id: "password", message: "Add a password", onActivate: {})], focusRequest: 1)
  let emptySummary = AurelglyphValidationSummary(issues: [])
  let items = [AurelglyphAccordionItem(id: "details", title: "Details") { Text("Content") }]
  let accordion = AurelglyphAccordion(items: items, openIDs: .constant(["details"]), mode: .multiple, headingLevel: .h2)
  let localAccordion = AurelglyphAccordion(items: items, defaultOpenIDs: ["details"])
  let stepper = AurelglyphStepper("Release", items: [.init(id: "review", title: "Review", status: .current)], onStepChange: { _ in })
  let rating = AurelglyphRating("Readiness", value: .constant(3), isRequired: true)
  let localRating = AurelglyphRating("Readiness", defaultValue: 3, isReadOnly: true)
  let values: [Any] = [link, unavailable, chip, localChip, password, group, actionGroup, summary, emptySummary,
    accordion, localAccordion, stepper, rating, localRating]
  #expect(values.count == 14)
  #expect(String(describing: type(of: group)).contains("AurelglyphInputGroup"))
}

@Test func unavailableLinkDropsItsDestinationEntirely() {
  let destination = URL(string: "https://example.com/private")!
  #expect(AurelglyphLink.availableDestination(destination, isDisabled: true) == nil)
  #expect(AurelglyphLink.availableDestination(nil, isDisabled: false) == nil)
  #expect(AurelglyphLink.availableDestination(destination, isDisabled: false) == destination)
}

@Test func localizesAllNewNativeControlCopyWithoutEnglishFragments() {
  let copy = AurelglyphControlCopy(loading: "Chargement", readOnly: "Lecture seule",
    unavailable: "Indisponible", externalLink: "Lien externe", showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe", required: "Obligatoire", invalid: "Invalide",
    validationSummary: "Vérifier le formulaire", clearRating: "Effacer la note",
    currentStep: "En cours", completedStep: "Terminée", upcomingStep: "À venir", errorStep: "À vérifier",
    disabledStep: "Indisponible", removeLabel: { "Retirer : \($0)" }, validationCount: { "Erreurs : \($0)" },
    stepValue: { "\($2) — \($0)/\($1) — \($3)" }, ratingValue: { "\($0)/\($1)" }, ratingChoice: { "Choisir \($0)/\($1)" })
  #expect(copy.showPassword == "Afficher le mot de passe")
  #expect(copy.hidePassword == "Masquer le mot de passe")
  #expect(copy.removeLabel("Local") == "Retirer : Local")
  #expect(copy.validationCount(2) == "Erreurs : 2")
  #expect(copy.stepValue(2, 4, "Review", AurelglyphStepStatus.current.label(copy: copy)) == "Review — 2/4 — En cours")
  #expect(copy.ratingValue(3, 5) == "3/5")
  #expect(copy.ratingChoice(4, 5) == "Choisir 4/5")
  #expect(aurelglyphFieldHint(isReadOnly: true, isRequired: true, isInvalid: true, isLoading: false,
    helpText: "Aide", error: "Erreur", unitDescription: "Dollars", copy: copy)
    == "Lecture seule. Obligatoire. Invalide. Dollars. Erreur")
}

@Test func nativeCaretRangesRemainWithinUTF16ValueAcrossVisibilityChanges() {
  #expect(aurelglyphClampedSelection(NSRange(location: 2, length: 3), text: "abcdef") == NSRange(location: 2, length: 3))
  #expect(aurelglyphClampedSelection(NSRange(location: 100, length: 4), text: "abc") == NSRange(location: 3, length: 0))
  #expect(aurelglyphClampedSelection(NSRange(location: 1, length: 100), text: "abc") == NSRange(location: 1, length: 2))
  #expect(aurelglyphClampedSelection(NSRange(location: NSNotFound, length: 0), text: "a🛠b") == NSRange(location: 4, length: 0))
}

@Test func normalizesAccordionPolicyInStableItemOrder() {
  let items = [
    AurelglyphAccordionItem(id: "one", title: "One") { Text("One") },
    AurelglyphAccordionItem(id: "two", title: "Two", isDisabled: true) { Text("Two") },
    AurelglyphAccordionItem(id: "three", title: "Three") { Text("Three") }
  ]
  #expect(AurelglyphAccordion.normalizedOpenIDs(["three", "one", "missing"], items: items, mode: .single) == ["one"])
  #expect(AurelglyphAccordion.normalizedOpenIDs(["three", "two", "missing"], items: items, mode: .multiple) == ["two", "three"])
  #expect(AurelglyphAccordion.changingOpenIDs(["one"], id: "three", expanded: true, mode: .single) == ["three"])
  #expect(AurelglyphAccordion.changingOpenIDs(["one"], id: "three", expanded: true, mode: .multiple) == ["one", "three"])
  #expect(AurelglyphAccordion.changingOpenIDs(["one", "three"], id: "one", expanded: false, mode: .multiple) == ["three"])
}

@Test func exposesExactlyOneCurrentStepAndKeepsOtherStatuses() {
  let items = [
    AurelglyphStep(id: "one", title: "One", status: .current),
    AurelglyphStep(id: "two", title: "Two", status: .current),
    AurelglyphStep(id: "three", title: "Three", status: .error),
    AurelglyphStep(id: "four", title: "Four", status: .disabled)
  ]
  #expect(items.map { AurelglyphStepper.status(for: $0, items: items, currentID: nil) } == [.current, .upcoming, .error, .disabled])
  #expect(items.map { AurelglyphStepper.status(for: $0, items: items, currentID: "two") } == [.upcoming, .current, .error, .disabled])
  #expect(AurelglyphStepper.status(for: items[3], items: items, currentID: "four") == .disabled)
  #expect(AurelglyphStepper.status(for: items[2], items: items, currentID: "three") == .error)
  #expect(AurelglyphStepper.isCurrent(items[2], items: items, currentID: "three"))
  #expect(items.filter { AurelglyphStepper.isCurrent($0, items: items, currentID: "three") }.count == 1)
  let inferred = [AurelglyphStep(id: "a", title: "A"), AurelglyphStep(id: "b", title: "B"), AurelglyphStep(id: "c", title: "C")]
  #expect(inferred.map { AurelglyphStepper.status(for: $0, items: inferred, currentID: "b") } == [.completed, .current, .upcoming])
}

@Test func boundsWholeNumberRatingAndProtectsRequiredClear() {
  #expect(AurelglyphRating.normalizedMaximum(0) == 1)
  #expect(AurelglyphRating.normalizedMaximum(1000) == 20)
  #expect(AurelglyphRating.normalizedValue(-2, maximum: 5) == 0)
  #expect(AurelglyphRating.normalizedValue(9, maximum: 5) == 5)
  #expect(AurelglyphRating.adjusted(1, direction: -1, maximum: 5, isRequired: true) == 1)
  #expect(AurelglyphRating.adjusted(1, direction: -1, maximum: 5, isRequired: false) == 0)
  #expect(AurelglyphRating.adjusted(0, direction: 1, maximum: 5, isRequired: true) == 1)
  #expect(AurelglyphRating.adjusted(0, direction: -1, maximum: 5, isRequired: true) == 0)
  #expect(AurelglyphRating.adjusted(5, direction: 1, maximum: 5, isRequired: false) == 5)
}

@Test @MainActor func wrapsTwentyNativeRatingTargetsAtNarrowAccessibilityWidths() {
  let normal = ImageRenderer(content: AurelglyphRating("Readiness", defaultValue: 3, maximum: 20))
  normal.proposedSize = ProposedViewSize(width: 320, height: nil)
  normal.scale = 1
  #expect(normal.cgImage?.width ?? 321 <= 320)
  #expect(normal.cgImage?.height ?? 0 >= 180)

  let accessible = ImageRenderer(content: AurelglyphRating("Readiness", defaultValue: 3, maximum: 20)
    .environment(\.dynamicTypeSize, .accessibility5)
    .environment(\.layoutDirection, .rightToLeft))
  accessible.proposedSize = ProposedViewSize(width: 240, height: nil)
  accessible.scale = 1
  #expect(accessible.cgImage?.width ?? 241 <= 240)
  #expect(accessible.cgImage?.height ?? 0 > normal.cgImage?.height ?? 0)
}

@Test @MainActor func rendersInvalidRatingMessageWithoutAnErrorString() {
  let normal = ImageRenderer(content: AurelglyphRating("Readiness", defaultValue: 3))
  let invalid = ImageRenderer(content: AurelglyphRating("Readiness", defaultValue: 3, isInvalid: true))
  normal.proposedSize = ProposedViewSize(width: 320, height: nil)
  invalid.proposedSize = ProposedViewSize(width: 320, height: nil)
  normal.scale = 1
  invalid.scale = 1
  #expect(invalid.cgImage?.height ?? 0 > normal.cgImage?.height ?? 0)
}

@Test @MainActor func readOnlyRatingUsesNeutralPaintWithoutChangingFilledGeometry() {
  let interactive = ImageRenderer(content: AurelglyphRating("Readiness", defaultValue: 3, allowsClear: false))
  let readOnly = ImageRenderer(content: AurelglyphRating("Readiness", defaultValue: 3, isReadOnly: true, allowsClear: false))
  interactive.proposedSize = ProposedViewSize(width: 320, height: nil)
  readOnly.proposedSize = ProposedViewSize(width: 320, height: nil)
  interactive.scale = 1
  readOnly.scale = 1
  #expect(interactive.cgImage?.width == readOnly.cgImage?.width)
  #expect(interactive.cgImage?.height == readOnly.cgImage?.height)
  if let activeData = interactive.cgImage?.dataProvider?.data,
     let neutralData = readOnly.cgImage?.dataProvider?.data {
    #expect(!CFEqual(activeData, neutralData))
  } else {
    Issue.record("Expected both rating states to render")
  }
}
