# frozen_string_literal: true

require_relative "lib/aurelglyph/rails/version"

Gem::Specification.new do |spec|
  spec.name = "aurelglyph-rails"
  spec.version = Aurelglyph::Rails::VERSION
  spec.authors = ["Ajit Chakrapani"]
  spec.summary = "Rails component helpers and interaction assets for Aurelglyph."
  spec.description = "Aurelglyph Rails provides ActionView-safe components, generated design assets, and dependency-free interaction controllers."
  spec.homepage = "https://github.com/absessive/aurelglyph"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.1"

  spec.files = Dir.chdir(__dir__) do
    Dir[
      "app/assets/**/*",
      "lib/**/*.rb",
      "README.md",
      "LICENSE.md",
      "aurelglyph-rails.gemspec"
    ]
  end
  spec.require_paths = ["lib"]

  spec.add_dependency "actionview", ">= 7.0", "< 9.0"
  spec.add_dependency "railties", ">= 7.0", "< 9.0"
end
