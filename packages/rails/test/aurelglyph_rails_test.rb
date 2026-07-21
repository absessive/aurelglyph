# frozen_string_literal: true

require "minitest/autorun"
require "pathname"

$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))

require "aurelglyph/rails"

class AurelglyphRailsTest < Minitest::Test
  VIEW_CLASS = ActionView::Base.with_empty_template_cache

  def test_loader_exposes_asset_path
    asset_path = Aurelglyph::Rails.asset_path

    assert_instance_of Pathname, asset_path
    assert asset_path.join("stylesheets/aurelglyph.css").exist?
    assert asset_path.join("javascripts/aurelglyph.js").exist?
    assert asset_path.join("fonts/aurelglyph/libre-baskerville-400.woff2").exist?
    assert asset_path.join("fonts/aurelglyph/OFL-1.1.txt").exist?
  end

  def test_helper_reads_generated_tokens
    helper = view_context

    assert_equal "#9358e8", helper.aurelglyph_token("color.accent.royal-purple.300")
  end

  def test_helper_reports_unknown_tokens
    helper = view_context

    error = assert_raises(KeyError) { helper.aurelglyph_token("color.accent.missing") }

    assert_match(/Unknown Aurelglyph token: color\.accent\.missing/, error.message)
  end

  def test_helper_renders_accessible_icons
    helper = view_context

    html = helper.aurelglyph_icon("thumbs-up", title: "Approve", class: "toolbar-icon")

    assert_includes html, 'class="ag-icon toolbar-icon"'
    assert_includes html, 'data-icon="thumbs-up"'
    assert_includes html, 'aria-label="Approve"'
    assert_includes html, 'role="img"'
    assert_includes html, '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">'
    assert_includes html, '<path d="M7 10v10H4V10h3Zm3'
  end

  def test_helper_renders_decorative_icons
    helper = view_context

    html = helper.aurelglyph_icon("notification", decorative: true)

    assert_includes html, 'data-icon="notification"'
    assert_includes html, 'aria-hidden="true"'
    refute_includes html, "aria-label"
    refute_includes html, "role="
  end

  def test_helper_reports_unknown_icons
    helper = view_context

    error = assert_raises(KeyError) { helper.aurelglyph_icon("missing") }

    assert_match(/Unknown Aurelglyph icon: missing/, error.message)
  end

  def test_icon_names_and_glyphs_match_the_react_contract
    react_source = File.read(File.expand_path("../../react/src/components/Icon.tsx", __dir__))
    glyph_match = react_source.match(/const glyphs:[\s\S]*?=\s*\{([\s\S]*?)\n\};/)
    refute_nil glyph_match
    glyph_block = glyph_match[1]
    react_glyphs = glyph_block.scan(/^\s*(?:"([^"]+)"|([a-z][\w-]*)):\s*"([^"]+)",?$/).to_h do |quoted, bare, path|
      [quoted || bare, path]
    end

    assert_equal react_glyphs, Aurelglyph::Rails::Helper::ICON_GLYPHS
    assert_equal react_glyphs.keys, Aurelglyph::Rails::Helper::ICON_NAMES
  end

  def test_helper_renders_expandable_sections
    helper = view_context

    html = helper.aurelglyph_expandable_section("Advanced settings", eyebrow: "System", open: true) do
      helper.content_tag(:p, "Animated content")
    end

    assert_includes html, "<details"
    assert_includes html, 'class="ag-disclosure"'
    assert_includes html, 'open="open"'
    assert_includes html, 'class="ag-disclosure__trigger"'
    assert_includes html, 'class="ag-icon ag-disclosure__icon"'
    assert_includes html, 'data-icon="chevron-down"'
    assert_includes html, '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">'
    assert_includes html, "Advanced settings"
    assert_includes html, "<p>Animated content</p>"
  end

  def test_helper_renders_phase_one_mobile_components
    helper = view_context

    card = helper.aurelglyph_card(title: "Status", eyebrow: "Live") { helper.content_tag(:p, "Systems operational") }
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
    helper = view_context

    nav = helper.aurelglyph_navigation_stack(title: "Workbench") do
      helper.aurelglyph_navigation_page("Systems") { helper.content_tag(:p, "Body") }
    end
    toolbar = helper.aurelglyph_toolbar { helper.content_tag(:button, "Save") }
    sheet = helper.aurelglyph_sheet("Details", id: "details-sheet", open: true) { helper.content_tag(:p, "Sheet body") }
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
    assert_includes sheet, 'id="details-sheet"'
    assert_includes sheet, 'data-aurelglyph-sheet=""'
    assert_includes sheet, 'data-open="true"'
    assert_match(/aria-labelledby="(ag-sheet-title-[a-f0-9]+)"/, sheet)
    assert_match(/<h2 class="ag-sheet__title" id="ag-sheet-title-[a-f0-9]+">Details<\/h2>/, sheet)
    refute_includes sheet, "aria-modal"
    refute_match(/<dialog[^>]*\sopen=/, sheet)
    assert_includes segmented, 'role="radiogroup"'
    assert_includes segmented, 'aria-checked="true"'
    assert_includes select, '<select id="theme"'
    assert_includes alert, 'role="status"'
    assert_includes empty, 'class="ag-empty-state"'
    assert_includes avatar, 'aria-label="Ajit Chakrapani"'
    assert_includes badge, 'class="ag-badge ag-badge--accent"'
  end

  def test_sheet_generates_unique_dialog_and_title_ids
    helper = view_context

    first = helper.aurelglyph_sheet("First") { helper.content_tag(:p, "First body") }
    second = helper.aurelglyph_sheet("Second") { helper.content_tag(:p, "Second body") }
    first_dialog_id = first.match(/<dialog[^>]*\sid="([^"]+)"/)[1]
    second_dialog_id = second.match(/<dialog[^>]*\sid="([^"]+)"/)[1]
    first_title_id = first.match(/aria-labelledby="([^"]+)"/)[1]
    second_title_id = second.match(/aria-labelledby="([^"]+)"/)[1]

    refute_equal first_dialog_id, second_dialog_id
    refute_equal first_title_id, second_title_id
    assert_includes first, %(id="#{first_title_id}")
    assert_includes second, %(id="#{second_title_id}")
    assert_includes first, 'data-open="false"'
    refute_match(/<dialog[^>]*\sopen=/, first)
  end

  def test_sheet_reserves_its_modal_state_data_attributes
    html = view_context.aurelglyph_sheet(
      "Details",
      open: true,
      aria: { describedby: "details-description", modal: "true" },
      data: { aurelglyph_sheet: "spoofed", controller: "details", open: "false" }
    )

    assert_equal 1, html.scan(/data-aurelglyph-sheet=/).length
    assert_equal 1, html.scan(/data-open=/).length
    assert_includes html, 'data-aurelglyph-sheet=""'
    assert_includes html, 'data-open="true"'
    assert_includes html, 'data-controller="details"'
    assert_includes html, 'aria-describedby="details-description"'
    refute_includes html, "aria-modal"
  end

  def test_helper_renders_phase_three_workbench_components
    helper = view_context

    breadcrumbs = helper.aurelglyph_breadcrumbs([{ label: "Workbench", href: "#workbench" }, { label: "Systems", current: true }])
    tabs = helper.aurelglyph_tabs([{ id: "overview", label: "Overview" }], active: "overview") { helper.content_tag(:p, "Panel") }
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

  def test_helpers_return_safe_buffers_while_escaping_untrusted_values
    html = view_context.aurelglyph_card(title: '<img src=x onerror="alert(1)">') do
      '<script>alert("unsafe")</script>'
    end

    assert_instance_of ActiveSupport::SafeBuffer, html
    assert html.html_safe?
    assert_includes html, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    assert_includes html, '&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;'
    refute_includes html, '<script>'
  end

  def test_helpers_render_unescaped_component_markup_in_action_view_templates
    template = <<~'ERB'
      <%= aurelglyph_card(title: title, data: { controller: controller }) do %>
        <p><%= body %></p>
      <% end %>
    ERB

    html = render_inline(
      template,
      title: '<em data-user="title">Status</em>',
      body: '<script>alert("body")</script>',
      controller: 'card" onclick="alert(1)'
    )

    assert_includes html, '<section data-controller="card&quot; onclick=&quot;alert(1)" class="ag-card">'
    assert_includes html, '<div class="ag-card__body">'
    assert_includes html, '<p>&lt;script&gt;alert(&quot;body&quot;)&lt;/script&gt;</p>'
    assert_includes html, '&lt;em data-user=&quot;title&quot;&gt;Status&lt;/em&gt;'
    refute_includes html, '&lt;section'
    refute_includes html, '<script>'
  end

  private

  def view_context
    VIEW_CLASS
      .new(ActionView::LookupContext.new([]), {}, nil)
      .extend(Aurelglyph::Rails::Helper)
  end

  def render_inline(template, **locals)
    view_context.render(inline: template, locals: locals)
  end
end
