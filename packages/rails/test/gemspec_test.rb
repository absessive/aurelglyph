# frozen_string_literal: true

require "minitest/autorun"
require "json"

class AurelglyphRailsGemspecTest < Minitest::Test
  def setup
    @package_root = File.expand_path("..", __dir__)
    @spec = Gem::Specification.load(File.join(@package_root, "aurelglyph-rails.gemspec"))
  end

  def test_gemspec_supports_git_installation
    assert_equal "aurelglyph-rails", @spec.name
    workspace_version = JSON.parse(File.read(File.expand_path("../../../package.json", __dir__))).fetch("version")
    assert_equal workspace_version, @spec.version.to_s
    assert_includes @spec.files, "lib/aurelglyph.rb"
    assert_includes @spec.files, "lib/aurelglyph/rails.rb"
    assert_includes @spec.files, "lib/aurelglyph/rails/engine.rb"
    assert_includes @spec.files, "lib/aurelglyph/rails/helper.rb"
    assert_includes @spec.files, "app/assets/stylesheets/aurelglyph.css"
    assert_includes @spec.files, "app/assets/javascripts/aurelglyph.js"
    assert_includes @spec.files, "app/assets/fonts/aurelglyph/libre-baskerville-400.woff2"
    assert_includes @spec.files, "app/assets/fonts/aurelglyph/OFL-1.1.txt"
    assert_includes @spec.files, "LICENSE.md"

    actionview = @spec.runtime_dependencies.find { |dependency| dependency.name == "actionview" }
    refute_nil actionview
    assert actionview.requirement.satisfied_by?(Gem::Version.new("7.0"))
    assert actionview.requirement.satisfied_by?(Gem::Version.new("8.1"))
    refute actionview.requirement.satisfied_by?(Gem::Version.new("9.0"))
  end
end
