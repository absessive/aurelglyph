public enum AurelglyphIcon: String, CaseIterable, Sendable {
  case home
  case dashboard
  case user
  case users
  case bell
  case mail
  case calendar
  case clock
  case plus
  case minus
  case upload
  case download
  case attachment
  case share
  case send
  case copy
  case save
  case lock
  case unlock
  case shield
  case eye
  case eyeOff = "eye-off"
  case search
  case filter
  case sort
  case menu
  case moreHorizontal = "more-horizontal"
  case moreVertical = "more-vertical"
  case settings
  case edit
  case delete
  case close
  case back
  case forward
  case chevronDown = "chevron-down"
  case chevronUp = "chevron-up"
  case externalLink = "external-link"
  case refresh
  case sync
  case check
  case warning
  case info
  case success
  case cloud
  case database
  case server
  case terminal
  case code
  case archive
  case star
  case heart
  case bookmark
  case tag
  case mapPin = "map-pin"
  case location
  case phone
  case message
  case chat
  case grid
  case list
  case columns
  case table
  case layout
  case panel
  case sidebar
  case command
  case packageIcon = "package"
  case cube
  case layers
  case workflow
  case branch
  case gitBranch = "git-branch"
  case link
  case unlink
  case logIn = "log-in"
  case logOut = "log-out"
  case power
  case play
  case pause
  case stop
  case record
  case microphone
  case camera
  case video
  case image
  case music
  case volume
  case mute
  case wallet
  case creditCard = "credit-card"
  case cart
  case receipt
  case chartLine = "chart-line"
  case chartBar = "chart-bar"
  case activity
  case spark
  case bolt
  case target
  case compass
  case thumbsUp = "thumbs-up"
  case thumbsDown = "thumbs-down"
  case help
  case notification
  case expand
  case contract

  public var accessibilityLabel: String {
    rawValue
      .split(separator: "-")
      .map { $0.prefix(1).uppercased() + $0.dropFirst() }
      .joined(separator: " ")
  }
}
