# frozen_string_literal: true

require_relative "lib/aurelglyph/rails/version"

Gem::Specification.new do |spec|
  spec.name = "aurelglyph-rails"
  spec.version = Aurelglyph::Rails::VERSION
  spec.authors = ["Ajit Chakrapani"]
  spec.summary = "Rails assets and token helpers for Aurelglyph."
  spec.description = "Aurelglyph Rails exposes generated design tokens and CSS assets for Rails apps."
  spec.homepage = "https://github.com/absessive/aurelglyph"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.1"

  spec.files = Dir.chdir(__dir__) do
    Dir[
      "app/assets/stylesheets/aurelglyph.css",
      "lib/**/*.rb",
      "README.md",
      "aurelglyph-rails.gemspec"
    ]
  end
  spec.require_paths = ["lib"]

  spec.add_dependency "railties", ">= 7.0", "< 9.0"
end
