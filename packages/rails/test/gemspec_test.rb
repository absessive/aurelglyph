# frozen_string_literal: true

require "minitest/autorun"

class AurelglyphRailsGemspecTest < Minitest::Test
  def setup
    @package_root = File.expand_path("..", __dir__)
    @spec = Gem::Specification.load(File.join(@package_root, "aurelglyph-rails.gemspec"))
  end

  def test_gemspec_supports_git_installation
    assert_equal "aurelglyph-rails", @spec.name
    assert_equal "0.4.0", @spec.version.to_s
    assert_includes @spec.files, "lib/aurelglyph.rb"
    assert_includes @spec.files, "lib/aurelglyph/rails.rb"
    assert_includes @spec.files, "lib/aurelglyph/rails/engine.rb"
    assert_includes @spec.files, "lib/aurelglyph/rails/helper.rb"
    assert_includes @spec.files, "app/assets/stylesheets/aurelglyph.css"
  end
end
