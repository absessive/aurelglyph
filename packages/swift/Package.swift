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
      resources: [
        .process("Resources")
      ]
    ),
    .testTarget(
      name: "AurelglyphUITests",
      dependencies: ["AurelglyphUI"]
    )
  ]
)
