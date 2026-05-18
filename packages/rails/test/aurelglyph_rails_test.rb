# frozen_string_literal: true

require "minitest/autorun"
require "pathname"

$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))

require "aurelglyph/rails"

class AurelglyphRailsTest < Minitest::Test
  def test_loader_exposes_asset_path
    asset_path = Aurelglyph::Rails.asset_path

    assert_instance_of Pathname, asset_path
    assert asset_path.join("stylesheets/aurelglyph.css").exist?
  end

  def test_helper_reads_generated_tokens
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    assert_equal "#9358e8", helper.aurelglyph_token("color.accent.royal-purple.300")
  end

  def test_helper_reports_unknown_tokens
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    error = assert_raises(KeyError) { helper.aurelglyph_token("color.accent.missing") }

    assert_match(/Unknown Aurelglyph token: color\.accent\.missing/, error.message)
  end

  def test_helper_renders_accessible_icons
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    html = helper.aurelglyph_icon("thumbs-up", title: "Approve", class: "toolbar-icon")

    assert_includes html, 'class="ag-icon toolbar-icon"'
    assert_includes html, 'data-icon="thumbs-up"'
    assert_includes html, 'aria-label="Approve"'
    assert_includes html, 'role="img"'
  end

  def test_helper_renders_decorative_icons
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    html = helper.aurelglyph_icon("notification", decorative: true)

    assert_includes html, 'data-icon="notification"'
    assert_includes html, 'aria-hidden="true"'
    refute_includes html, "aria-label"
    refute_includes html, "role="
  end

  def test_helper_reports_unknown_icons
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    error = assert_raises(KeyError) { helper.aurelglyph_icon("missing") }

    assert_match(/Unknown Aurelglyph icon: missing/, error.message)
  end

  def test_helper_renders_expandable_sections
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    html = helper.aurelglyph_expandable_section("Advanced settings", eyebrow: "System", open: true) do
      "<p>Animated content</p>"
    end

    assert_includes html, "<details"
    assert_includes html, 'class="ag-disclosure"'
    assert_includes html, 'open="open"'
    assert_includes html, 'class="ag-disclosure__trigger"'
    assert_includes html, "Advanced settings"
    assert_includes html, "<p>Animated content</p>"
  end
end
