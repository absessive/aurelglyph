// swift-tools-version: 5.9

import PackageDescription

let package = Package(
  name: "AurelglyphUI",
  platforms: [
    .iOS(.v17),
    .macOS(.v14)
  ],
  products: [
    .library(name: "AurelglyphUI", targets: ["AurelglyphUI"])
  ],
  targets: [
    .target(
      name: "AurelglyphUI",
      path: "packages/swift/Sources/AurelglyphUI"
    ),
    .testTarget(
      name: "AurelglyphUITests",
      dependencies: ["AurelglyphUI"],
      path: "packages/swift/Tests/AurelglyphUITests"
    )
  ]
)
