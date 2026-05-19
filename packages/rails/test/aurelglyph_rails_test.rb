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

  def test_helper_renders_phase_one_mobile_components
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    card = helper.aurelglyph_card(title: "Status", eyebrow: "Live") { "<p>Systems operational</p>" }
    list = helper.aurelglyph_list_section(title: "Settings") do
      helper.aurelglyph_list_row("Quiet mode", description: "Enabled", icon: "bell", selected: true, trailing: "On")
    end
    tabs = helper.aurelglyph_tab_bar(
      [
        { id: "workbench", label: "Workbench", href: "#workbench", icon: "dashboard" },
        { id: "systems", label: "Systems", href: "#systems", icon: "settings" }
      ],
      active: "systems"
    )
    search = helper.aurelglyph_search_field(name: "query", label: "Search systems")
    toggle = helper.aurelglyph_switch(name: "quiet", label: "Quiet mode", checked: true, description: "Reduce notifications")

    assert_includes card, 'class="ag-card"'
    assert_includes card, "Systems operational"
    assert_includes list, 'class="ag-list-section"'
    assert_includes list, 'class="ag-list-row is-selected"'
    assert_includes tabs, 'class="ag-tab-bar"'
    assert_includes tabs, 'aria-current="page"'
    assert_includes search, 'type="search"'
    assert_includes toggle, 'role="switch"'
    assert_includes toggle, 'checked="checked"'
  end

  def test_helper_renders_phase_two_mobile_app_components
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    nav = helper.aurelglyph_navigation_stack(title: "Workbench") do
      helper.aurelglyph_navigation_page("Systems") { "<p>Body</p>" }
    end
    toolbar = helper.aurelglyph_toolbar { "<button>Save</button>" }
    sheet = helper.aurelglyph_sheet("Details", open: true) { "<p>Sheet body</p>" }
    segmented = helper.aurelglyph_segmented_control([{ id: "grid", label: "Grid" }], active: "grid")
    select = helper.aurelglyph_select(name: "theme", label: "Theme", options: [{ label: "Royal purple", value: "royal-purple" }], selected: "royal-purple")
    alert = helper.aurelglyph_alert("Synced", tone: "success")
    empty = helper.aurelglyph_empty_state("No systems")
    avatar = helper.aurelglyph_avatar("Ajit Chakrapani")
    badge = helper.aurelglyph_badge("Live", tone: "accent")

    assert_includes nav, 'class="ag-nav-stack"'
    assert_includes nav, 'class="ag-nav-page"'
    assert_includes toolbar, 'role="toolbar"'
    assert_includes sheet, "<dialog"
    assert_includes sheet, 'aria-modal="true"'
    assert_includes segmented, 'role="radiogroup"'
    assert_includes segmented, 'aria-checked="true"'
    assert_includes select, '<select id="theme"'
    assert_includes alert, 'role="status"'
    assert_includes empty, 'class="ag-empty-state"'
    assert_includes avatar, 'aria-label="Ajit Chakrapani"'
    assert_includes badge, 'class="ag-badge ag-badge--accent"'
  end

  def test_helper_renders_phase_three_workbench_components
    helper = Object.new.extend(Aurelglyph::Rails::Helper)

    breadcrumbs = helper.aurelglyph_breadcrumbs([{ label: "Workbench", href: "#workbench" }, { label: "Systems", current: true }])
    tabs = helper.aurelglyph_tabs([{ id: "overview", label: "Overview" }], active: "overview") { "<p>Panel</p>" }
    toast = helper.aurelglyph_toast("Saved", tone: "success")
    progress = helper.aurelglyph_progress(value: 42)
    skeleton = helper.aurelglyph_skeleton
    metric = helper.aurelglyph_metric(label: "Latency", value: "42ms", delta: "Stable")
    table = helper.aurelglyph_data_table(columns: [{ key: :name, header: "Name" }], rows: [{ name: "System" }])
    pagination = helper.aurelglyph_pagination(current_page: 2, total_pages: 3)
    command = helper.aurelglyph_command_palette([{ id: "search", label: "Search", icon: "search", shortcut: "Cmd-K" }])

    assert_includes breadcrumbs, 'aria-current="page"'
    assert_includes tabs, 'role="tablist"'
    assert_includes tabs, 'role="tabpanel"'
    assert_includes toast, 'role="status"'
    assert_includes progress, 'role="progressbar"'
    assert_includes progress, 'aria-valuenow="42"'
    assert_includes skeleton, 'class="ag-skeleton"'
    assert_includes metric, 'class="ag-metric"'
    assert_includes table, 'class="ag-table"'
    assert_includes pagination, 'aria-current="page"'
    assert_includes command, 'role="dialog"'
    assert_includes command, 'role="listbox"'
  end
end
