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
    command = helper.aurelglyph_command_palette([
      { id: "search", label: "Search", icon: "search", shortcut: "Cmd-K" },
      { id: "archive", label: "Archive", keywords: %w[storage legacy], name: "command", form_value: "archive" },
      {
        id: "preview",
        label: "Preview",
        name: "command",
        form_value: "preview",
        attributes: { type: "button" }
      }
    ])

    assert_includes breadcrumbs, 'aria-current="page"'
    assert_includes tabs, 'role="tablist"'
    assert_includes tabs, 'role="tabpanel"'
    assert_includes toast, 'role="status"'
    assert_includes progress, 'role="progressbar"'
    assert_includes progress, 'aria-valuenow="42"'
    assert_includes skeleton, 'class="ag-skeleton"'
    assert_includes metric, 'class="ag-metric"'
    assert_includes table, 'class="ag-table"'
    assert_includes table, 'aria-label="Data table"'
    assert_includes table, 'role="region"'
    assert_includes table, 'tabindex="0"'
    assert_includes pagination, 'aria-current="page"'
    assert_includes command, 'role="dialog"'
    assert_includes command, 'role="listbox"'
    assert_includes command, 'data-keywords="storage legacy"'
    assert_includes command, 'data-aurelglyph-command-empty=""'
    assert_includes command, 'No commands found.'
    assert_match(/class="ag-command-palette__empty"[^>]*role="option"[^>]*aria-disabled="true"[^>]*aria-live="polite"/, command)
    assert_match(/type="submit"[^>]*name="command"[^>]*value="archive"/, command)
    assert_match(/type="button"[^>]*name="command"[^>]*value="preview"/, command)
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

  def test_helper_renders_dialogs_and_drawers_with_modal_intent_and_kind_contracts
    helper = view_context
    dialog = helper.aurelglyph_dialog(
      '<img src=x onerror="alert(1)">',
      id: "confirm-dialog",
      open: true,
      variant: "compact",
      data: { open: "false", controller: "confirm" }
    ) { '<script>alert("body")</script>' }
    drawer = helper.aurelglyph_drawer("Inspector", id: "inspector", side: "start") { "Details" }
    locked = helper.aurelglyph_dialog("Locked", dismissible: false) { "Wait" }

    assert_instance_of ActiveSupport::SafeBuffer, dialog
    assert_includes dialog, 'class="ag-sheet ag-dialog is-open"'
    assert_includes dialog, 'data-aurelglyph-sheet=""'
    assert_includes dialog, 'data-aurelglyph-dialog=""'
    assert_includes dialog, 'data-aurelglyph-overlay="dialog"'
    assert_includes dialog, 'data-dismissible="true"'
    assert_includes dialog, 'data-open="true"'
    assert_includes dialog, 'data-variant="compact"'
    assert_includes dialog, 'data-controller="confirm"'
    assert_equal 1, dialog.scan(/data-open=/).length
    assert_includes dialog, 'data-aurelglyph-sheet-dismiss=""'
    assert_includes dialog, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    assert_includes dialog, '&lt;script&gt;alert(&quot;body&quot;)&lt;/script&gt;'
    refute_match(/<dialog[^>]*\sopen=/, dialog)
    refute_includes dialog, "aria-modal"

    assert_includes drawer, 'class="ag-sheet ag-drawer ag-drawer--start"'
    assert_includes drawer, 'data-aurelglyph-drawer=""'
    assert_includes drawer, 'data-side="start"'
    assert_includes locked, 'data-dismissible="false"'
    refute_includes locked, 'data-aurelglyph-sheet-dismiss'
    assert_raises(ArgumentError) { helper.aurelglyph_drawer("Bad", side: "diagonal") }
  end

  def test_helper_renders_menu_popover_and_tooltip_interaction_markup
    helper = view_context
    menu = helper.aurelglyph_menu(
      label: "Actions",
      id: "actions",
      items: [
        { label: '<b onclick="x">Open</b>', value: "open", icon: "archive" },
        { separator: true },
        { label: "Delete", value: "delete", disabled: true },
        { label: "Archive", value: "archive", name: "action", form_value: "archive" },
        {
          label: "Preview",
          value: "preview",
          name: "action",
          form_value: "preview",
          attributes: { type: "button" }
        }
      ]
    )
    dropdown = helper.aurelglyph_dropdown(label: "More", items: [{ label: "Archive", href: "/archive" }])
    disabled_menu = helper.aurelglyph_menu(
      label: "Unavailable",
      items: [{ label: "Delete", value: "delete" }],
      open: true,
      disabled: true,
      trigger_attributes: { "disabled" => true }
    )
    popover = helper.aurelglyph_popover(trigger: "Filters", label: "Filter systems", id: "filters") do
      helper.content_tag(:button, "Apply", data: { aurelglyph_popover_dismiss: true })
    end
    disabled_popover = helper.aurelglyph_popover(
      trigger: "Unavailable filters",
      label: "Unavailable filters",
      disabled: true,
      trigger_attributes: { "disabled" => true }
    ) { "Filters" }
    tooltip = helper.aurelglyph_tooltip('<script>unsafe</script>', label: "Information")

    assert_instance_of ActiveSupport::SafeBuffer, dropdown
    assert_includes menu, 'data-aurelglyph-menu=""'
    assert_includes menu, 'aria-haspopup="menu"'
    assert_includes menu, 'role="menu" hidden="hidden"'
    assert_includes menu, 'data-aurelglyph-menu-item=""'
    assert_includes menu, 'role="separator"'
    assert_includes menu, '&lt;b onclick=&quot;x&quot;&gt;Open&lt;/b&gt;'
    assert_includes menu, 'disabled="disabled"'
    assert_match(/type="submit"[^>]*name="action"[^>]*value="archive"/, menu)
    assert_match(/type="button"[^>]*name="action"[^>]*value="preview"/, menu)
    assert_includes dropdown, 'class="ag-menu ag-dropdown"'
    assert_includes dropdown, 'href="/archive"'
    assert_includes disabled_menu, 'data-open="false"'
    assert_includes disabled_menu, 'aria-expanded="false"'
    assert_includes disabled_menu, 'role="menu" hidden="hidden"'
    refute_includes disabled_menu, 'is-open'
    disabled_menu_trigger = disabled_menu.scan(/<button[^>]*>/).find { |tag| tag.include?('ag-menu__trigger') }
    assert_equal 1, disabled_menu_trigger.scan(/\sdisabled=/).length

    assert_includes popover, 'data-aurelglyph-popover=""'
    assert_includes popover, 'aria-haspopup="dialog"'
    assert_includes popover, 'role="dialog"'
    assert_includes popover, 'data-aurelglyph-popover-dismiss="true"'
    disabled_popover_trigger = disabled_popover.scan(/<button[^>]*>/).find { |tag| tag.include?('ag-popover__trigger') }
    assert_equal 1, disabled_popover_trigger.scan(/\sdisabled=/).length
    assert_includes tooltip, 'data-aurelglyph-tooltip=""'
    assert_includes tooltip, 'role="tooltip"'
    assert_includes tooltip, '&lt;script&gt;unsafe&lt;/script&gt;'
    refute_includes tooltip, '<script>'
  end

  def test_helper_renders_buttons_and_native_form_controls_with_shared_states
    helper = view_context
    icon_button = helper.aurelglyph_icon_button(
      icon: "settings",
      label: 'Settings "unsafe"',
      href: "/settings",
      loading: true
    )
    default_icon_button = helper.aurelglyph_icon_button(icon: "settings", label: "Settings")
    submit_icon_button = helper.aurelglyph_icon_button(icon: "save", label: "Save", type: "submit")
    group = helper.aurelglyph_button_group(label: "Editing") { helper.content_tag(:button, "Save") }
    checkbox = helper.aurelglyph_checkbox(
      name: "quiet",
      label: "Quiet mode",
      description: "Reduce notifications",
      error: "Choose a value",
      required: true
    )
    indeterminate_checkbox = helper.aurelglyph_checkbox(
      name: "partial",
      label: "Partial",
      indeterminate: true
    )
    disabled_read_only_checkbox = helper.aurelglyph_checkbox(
      name: "locked",
      label: "Locked",
      checked: true,
      disabled: true,
      read_only: true
    )
    radios = helper.aurelglyph_radio_group(
      name: "theme",
      label: "Theme",
      value: "royal",
      options: [{ label: "Royal purple", value: "royal" }, { label: "Steel", value: "steel", disabled: true }]
    )
    empty_read_only_radios = helper.aurelglyph_radio_group(
      name: "mode",
      label: "Mode",
      options: [{ label: "Quiet", value: "quiet" }],
      read_only: true
    )
    disabled_value_radios = helper.aurelglyph_radio_group(
      name: "theme",
      label: "Theme",
      value: "steel",
      options: [{ label: "Royal purple", value: "royal" }, { label: "Steel", value: "steel", disabled: true }]
    )
    disabled_value_read_only_radios = helper.aurelglyph_radio_group(
      name: "locked_theme",
      label: "Locked theme",
      value: "steel",
      options: [{ label: "Royal purple", value: "royal" }, { label: "Steel", value: "steel", disabled: true }],
      read_only: true
    )
    read_only_select = helper.aurelglyph_select(
      name: "density",
      label: "Density",
      options: [{ label: "Compact", value: "compact" }, { label: "Comfortable", value: "comfortable" }],
      read_only: true
    )
    fallback_select = helper.aurelglyph_select(
      name: "fallback",
      label: "Fallback",
      options: [{ label: "Unavailable", value: "off", disabled: true }, { label: "Ready", value: "ready" }],
      read_only: true
    )
    disabled_value_select = helper.aurelglyph_select(
      name: "editable_fallback",
      label: "Editable fallback",
      options: [{ label: "Unavailable", value: "off", disabled: true }, { label: "Ready", value: "ready" }],
      selected: "off"
    )
    disabled_value_read_only_select = helper.aurelglyph_select(
      name: "locked_fallback",
      label: "Locked fallback",
      options: [{ label: "Unavailable", value: "off", disabled: true }, { label: "Ready", value: "ready" }],
      selected: "off",
      read_only: true
    )
    all_disabled_select = helper.aurelglyph_select(
      name: "none",
      label: "None",
      options: [{ label: "Unavailable", value: "off", disabled: true }],
      read_only: true
    )
    normal_switch = helper.aurelglyph_switch(name: "signal", label: "Signal", value: "active", checked: true)
    read_only_switch = helper.aurelglyph_switch(
      name: "signal",
      label: "Signal",
      value: "active",
      checked: true,
      read_only: true
    )
    slider = helper.aurelglyph_slider(name: "volume", label: "Volume", value: 42, read_only: true)
    clamped_slider = helper.aurelglyph_slider(name: "gain", label: "Gain", value: 140, max: 100, read_only: true)
    stepped_slider = helper.aurelglyph_slider(name: "steps", label: "Steps", value: 41, step: 5, read_only: true)
    edge_slider = helper.aurelglyph_slider(name: "edge", label: "Edge", value: 99, max: 100, step: 30, read_only: true)
    number = helper.aurelglyph_number_field(name: "retries", label: "Retries", value: 3, min: 0, max: 5, invalid: true)
    clamped_number = helper.aurelglyph_number_field(name: "workers", label: "Workers", value: 12, min: 1, max: 5)
    stepped_number = helper.aurelglyph_number_field(name: "batch", label: "Batch", value: 9, min: 0, max: 10, step: 3)
    normalized_step_number = helper.aurelglyph_number_field(name: "normalized", label: "Normalized", value: 3, step: -3)
    negative_blank_number = helper.aurelglyph_number_field(name: "offset", label: "Offset", max: -5)
    unbounded_number = helper.aurelglyph_number_field(
      name: "unbounded",
      label: "Unbounded",
      value: 3,
      min: nil,
      max: nil,
      placeholder: nil,
      **{ "min" => "99", "max" => "100", "step" => "7", "placeholder" => "Spoofed" }
    )

    assert_includes icon_button, 'class="ag-button ag-button--secondary ag-icon-button is-loading"'
    assert_includes icon_button, 'aria-label="Settings &quot;unsafe&quot;"'
    assert_includes icon_button, 'aria-disabled="true"'
    refute_includes icon_button, 'href="/settings"'
    refute_includes default_icon_button, ">false<"
    assert_match(/<button[^>]*type="button"/, default_icon_button)
    assert_match(/<button[^>]*type="submit"/, submit_icon_button)
    assert_includes group, 'role="group"'

    assert_includes checkbox, 'type="checkbox"'
    assert_includes checkbox, 'required="required"'
    assert_includes checkbox, 'aria-invalid="true"'
    assert_match(/aria-describedby="ag-checkbox-[a-f0-9]+-description ag-checkbox-[a-f0-9]+-error"/, checkbox)
    assert_includes checkbox, 'aria-live="polite"'
    assert_includes indeterminate_checkbox, 'data-aurelglyph-checkbox-input=""'
    assert_includes indeterminate_checkbox, 'data-indeterminate="true"'
    assert_includes indeterminate_checkbox, 'aria-checked="mixed"'
    refute_includes disabled_read_only_checkbox, 'type="hidden"'
    assert_includes radios, '<fieldset'
    assert_includes radios, 'checked="checked"'
    assert_includes radios, 'disabled="disabled"'
    refute_includes empty_read_only_radios, 'name="mode"'
    refute_includes disabled_value_radios, 'checked="checked"'
    refute_includes disabled_value_read_only_radios, 'name="locked_theme"'
    assert_includes read_only_select, '<option value="compact" selected="selected">Compact</option>'
    assert_includes read_only_select, 'type="hidden" name="density" value="compact"'
    assert_includes fallback_select, '<option value="ready" selected="selected">Ready</option>'
    assert_includes fallback_select, 'type="hidden" name="fallback" value="ready"'
    assert_includes disabled_value_select, '<option value="ready" selected="selected">Ready</option>'
    assert_includes disabled_value_read_only_select, '<option value="ready" selected="selected">Ready</option>'
    assert_includes disabled_value_read_only_select, 'type="hidden" name="locked_fallback" value="ready"'
    refute_includes all_disabled_select, 'type="hidden" name="none"'
    assert_includes normal_switch, 'name="signal" value="active"'
    assert_includes normal_switch, 'data-aurelglyph-switch-input=""'
    assert_includes read_only_switch, 'type="hidden" name="signal" value="active"'
    assert_includes slider, 'type="range"'
    assert_includes slider, 'aria-readonly="true"'
    assert_includes slider, 'type="hidden" name="volume" value="42"'
    assert_includes clamped_slider, '<output class="ag-slider__value" for="'
    assert_includes clamped_slider, '>100</output>'
    assert_includes clamped_slider, 'type="hidden" name="gain" value="100"'
    assert_includes stepped_slider, '>40</output>'
    assert_includes stepped_slider, 'type="hidden" name="steps" value="40"'
    assert_includes edge_slider, '>90</output>'
    assert_includes edge_slider, 'type="hidden" name="edge" value="90"'
    assert_includes number, 'type="number"'
    assert_includes number, 'aria-invalid="true"'
    assert_includes clamped_number, 'name="workers" type="number" value="5"'
    assert_match(/<button(?=[^>]*data-aurelglyph-number-step="1")(?=[^>]*disabled="disabled")[^>]*>/, clamped_number)
    assert_match(/<button(?=[^>]*data-aurelglyph-number-step="1")(?=[^>]*disabled="disabled")[^>]*>/, stepped_number)
    assert_includes normalized_step_number, 'step="3"'
    refute_includes negative_blank_number, 'disabled="disabled"'
    assert_includes unbounded_number, 'step="1"'
    refute_includes unbounded_number, 'min="99"'
    refute_includes unbounded_number, 'max="100"'
    refute_includes unbounded_number, "Spoofed"
    assert_raises(ArgumentError) { helper.aurelglyph_slider(name: "bad", label: "Bad", value: 1, min: 2, max: 1) }
  end

  def test_helper_renders_combobox_and_autocomplete_as_server_form_controls
    helper = view_context
    options = [
      { label: "Alpha", value: "alpha" },
      { label: '<img src=x onerror="x">', value: 'unsafe" value', disabled: true }
    ]
    combobox = helper.aurelglyph_combobox(
      name: "system_id",
      label: "System",
      options: options,
      value: "alpha",
      help_text: "Choose a system",
      open: true,
      busy: true,
      required: true
    )
    autocomplete = helper.aurelglyph_autocomplete(name: "archive_id", label: "Archive", options: options)
    disabled_combobox = helper.aurelglyph_combobox(
      name: "disabled_system_id",
      label: "Disabled system",
      options: options,
      value: "alpha",
      open: true,
      disabled: true
    )
    read_only_combobox = helper.aurelglyph_combobox(
      name: "readonly_system_id",
      label: "Readonly system",
      options: options,
      value: "alpha",
      open: true,
      read_only: true
    )
    loading_combobox = helper.aurelglyph_combobox(
      name: "loading_system_id",
      label: "Loading system",
      options: options,
      value: "alpha",
      loading: true
    )
    nil_combobox = helper.aurelglyph_combobox(
      name: "optional_system_id",
      label: "Optional system",
      options: [{ label: "None", value: "" }, { label: "Alpha", value: "alpha" }]
    )

    assert_instance_of ActiveSupport::SafeBuffer, autocomplete
    assert_includes combobox, 'class="ag-combobox is-open"'
    assert_includes combobox, 'data-aurelglyph-combobox=""'
    assert_includes combobox, 'data-busy="true"'
    assert_includes combobox, 'role="combobox"'
    assert_includes combobox, 'aria-autocomplete="list"'
    assert_includes combobox, 'aria-expanded="true"'
    assert_includes combobox, 'type="hidden" name="system_id" value="alpha"'
    assert_includes combobox, 'role="listbox"'
    assert_includes combobox, 'role="option"'
    assert_includes combobox, 'aria-selected="true"'
    assert_includes combobox, '&lt;img src=x onerror=&quot;x&quot;&gt;'
    assert_includes combobox, 'data-value="unsafe&quot; value"'
    refute_match(/data-aurelglyph-combobox-listbox=""[^>]*hidden=/, combobox)
    [disabled_combobox, read_only_combobox].each do |unavailable_combobox|
      assert_includes unavailable_combobox, 'data-open="false"'
      assert_includes unavailable_combobox, 'aria-expanded="false"'
      assert_match(/role="listbox"[^>]*hidden="hidden"/, unavailable_combobox)
      refute_includes unavailable_combobox, 'is-open'
    end
    assert_match(/type="hidden"[^>]*disabled="disabled"[^>]*data-aurelglyph-combobox-value=""/, loading_combobox)
    refute_match(/class="[^"]*is-selected[^"]*"[^>]*data-value=""/, nil_combobox)
    refute_match(/aria-selected="true"[^>]*data-value=""/, nil_combobox)
  end

  def test_helper_renders_feedback_and_validated_layout_primitives
    helper = view_context
    spinner = helper.aurelglyph_spinner(label: "Synchronizing", size: "sm")
    divider = helper.aurelglyph_divider(label: "Archived", orientation: "vertical")
    surface = helper.aurelglyph_surface(as: :article, elevation: "floating", padding: "lg") { "Surface" }
    default_surface = helper.aurelglyph_surface { "Default surface" }
    box = helper.aurelglyph_box { "Box" }
    stack = helper.aurelglyph_stack(direction: "row", gap: 6, align: "center", justify: "between", wrap: true) { "Stack" }
    container = helper.aurelglyph_container(size: "xl") { "Container" }
    grid = helper.aurelglyph_grid(columns: { base: 2, md: 4 }, gap: "1.5rem", min_item_width: "14rem") { "Grid" }

    assert_includes spinner, 'class="ag-spinner ag-spinner--sm"'
    assert_includes spinner, 'role="status"'
    assert_includes spinner, 'data-size="sm"'
    assert_includes divider, 'role="separator"'
    assert_includes divider, 'aria-orientation="vertical"'
    refute_includes divider, 'ag-divider__label'
    assert_includes surface, '<article data-elevation="floating" data-padding="lg" class="ag-surface">'
    assert_includes default_surface, '<div data-elevation="raised" data-padding="md" class="ag-surface">'
    assert_includes box, 'class="ag-surface ag-box"'
    assert_includes stack, 'data-direction="row"'
    assert_includes stack, 'data-wrap="true"'
    assert_includes stack, '--ag-stack-gap: var(--ag-space-6)'
    assert_includes container, 'data-size="xl"'
    assert_includes grid, '--ag-grid-columns: 2'
    assert_includes grid, '--ag-grid-columns-md: 4'
    assert_includes grid, '--ag-grid-target-width: 50%'
    assert_includes grid, '--ag-grid-target-width-md: 25%'
    assert_includes grid, '--ag-grid-min-item-width: 14rem'
    assert_raises(ArgumentError) { helper.aurelglyph_surface(as: :script) }
    assert_raises(ArgumentError) { helper.aurelglyph_grid(columns: 13) }
    assert_raises(ArgumentError) { helper.aurelglyph_grid(min_item_width: '1rem; color: red') }
  end

  def test_helper_hardens_selection_progress_and_pagination_semantics
    helper = view_context
    row = helper.aurelglyph_list_row("Quiet mode", selected: true)
    option_row = helper.aurelglyph_list_row("Quiet mode", selected: true, role: "option")
    tree_row = helper.aurelglyph_list_row("Node", selected: true, role: "treeitem")
    progress = helper.aurelglyph_progress(value: 140, max: 100)
    pagination = helper.aurelglyph_pagination(
      current_page: 2,
      total_pages: 3,
      page_url: ->(page) { "/systems?page=#{page}" }
    )
    segmented = helper.aurelglyph_segmented_control(
      [{ id: "grid", label: "Grid", disabled: true }, { id: "list", label: "List" }],
      active: "grid",
      name: "layout"
    )
    tabs = helper.aurelglyph_tabs(
      [
        { id: "overview", label: "Overview", disabled: true },
        { id: "activity", label: "Activity", content: "Activity panel" }
      ],
      active: "overview"
    ) { "Overview panel" }

    assert_includes row, 'data-selected="true"'
    refute_includes row, "aria-selected"
    assert_includes option_row, 'aria-selected="true"'
    assert_includes tree_row, 'aria-selected="true"'
    assert_includes progress, 'aria-valuenow="100"'
    assert_includes progress, 'inline-size: 100.0%'
    assert_includes pagination, 'href="/systems?page=1"'
    assert_includes pagination, 'href="/systems?page=3"'
    refute_includes pagination, "<button"
    large_pagination = helper.aurelglyph_pagination(
      current_page: 250_000,
      total_pages: 500_000,
      page_url: "/systems?page=%{page}"
    )
    assert_equal 2, large_pagination.scan('class="ag-pagination__ellipsis"').length
    assert_includes large_pagination, 'href="/systems?page=1"'
    assert_includes large_pagination, 'href="/systems?page=249999"'
    assert_includes large_pagination, 'aria-current="page" aria-label="Page 250000"'
    assert_includes large_pagination, 'href="/systems?page=250001"'
    assert_includes large_pagination, 'href="/systems?page=500000"'
    assert_operator large_pagination.length, :<, 5_000
    assert_includes segmented, 'data-aurelglyph-selection-group="segmented"'
    assert_includes segmented, 'type="hidden" name="layout" value="list"'
    assert_match(/tabindex="0"[^>]*data-value="list"/, segmented)
    assert_includes tabs, 'data-aurelglyph-selection-group="tabs"'
    assert_match(/tabindex="0"[^>]*data-value="activity"/, tabs)
    assert_equal 2, tabs.scan(/role="tabpanel"/).length
    assert_includes tabs, 'hidden="hidden"'
    assert_raises(ArgumentError) { helper.aurelglyph_progress(value: "50oops", max: 100) }
    assert_raises(ArgumentError) { helper.aurelglyph_progress(value: 50, max: "100oops") }
  end

  def test_helpers_reserve_computed_state_and_structural_attributes
    helper = view_context
    row = helper.aurelglyph_list_row(
      "Selected",
      selected: true,
      role: "option",
      data: { selected: "false" },
      aria: { selected: "false" }
    )
    progress = helper.aurelglyph_progress(
      value: 5,
      max: 10,
      aria: { label: "Fake", valuenow: "999", valuemax: "999" }
    )
    radios = helper.aurelglyph_radio_group(
      name: "mode",
      label: "Mode",
      value: "quiet",
      options: [{ label: "Quiet", value: "quiet" }],
      invalid: true,
      busy: true,
      "disabled" => true,
      data: { busy: "false", invalid: "false" },
      aria: { busy: "false", invalid: "false" }
    )
    menu = helper.aurelglyph_menu(
      label: "Actions",
      items: [{ label: "Archive", attributes: { "role" => "option", "tabindex" => 7 } }],
      trigger_attributes: { "id" => "bad-id", "role" => "link", "type" => "submit" },
      data: { "aurelglyph-menu" => "spoofed", "open" => "true", "placement" => "top-end" }
    )
    combobox = helper.aurelglyph_combobox(
      name: "system",
      label: "System",
      options: [{ label: "Alpha", value: "alpha" }],
      placeholder: "Search systems",
      input_attributes: {
        "id" => "bad-input",
        "aria-activedescendant" => "missing-option",
        "placeholder" => "Spoofed placeholder",
        "role" => "searchbox",
        "type" => "email"
      }
    )
    spinner = helper.aurelglyph_spinner(role: "presentation")
    group = helper.aurelglyph_button_group(label: "Actions", role: "presentation") { "Controls" }
    icon_button = helper.aurelglyph_icon_button(
      icon: "settings",
      label: "Settings",
      disabled: false,
      "disabled" => true,
      "type" => "submit"
    )
    disabled_icon_link = helper.aurelglyph_icon_button(
      icon: "settings",
      label: "Settings",
      href: "/settings",
      disabled: true,
      "href" => "/evil",
      "tabindex" => 0
    )
    enabled_icon_link = helper.aurelglyph_icon_button(
      icon: "settings",
      label: "Settings",
      href: "/settings",
      "href" => "/evil",
      "aria-disabled" => "true"
    )
    tooltip_link = helper.aurelglyph_tooltip(
      "Settings help",
      trigger: "Settings",
      href: "/settings",
      trigger_attributes: { "href" => "/evil" }
    )
    disabled_link_menu = helper.aurelglyph_menu(
      label: "Actions",
      items: [{
        label: "Archive",
        href: "/archive",
        disabled: true,
        attributes: {
          "disabled" => false,
          "href" => "/evil",
          "name" => "action",
          "tabindex" => 0,
          "value" => "evil"
        }
      }]
    )
    disabled_command_link = helper.aurelglyph_command_palette(
      [{
        id: "archive",
        label: "Archive",
        href: "/archive",
        disabled: true,
        attributes: {
          "disabled" => false,
          "href" => "/evil",
          "name" => "command",
          "tabindex" => 0,
          "value" => "evil"
        }
      }]
    )
    unchecked_checkbox = helper.aurelglyph_checkbox(
      name: "quiet",
      label: "Quiet",
      checked: false,
      "checked" => true
    )
    unchecked_switch = helper.aurelglyph_switch(
      name: "signal",
      label: "Signal",
      checked: false,
      "checked" => true
    )
    tabs = helper.aurelglyph_tabs(
      [{ id: "general", label: "General" }],
      active: "general",
      "class" => "custom-tabs"
    )
    icon = helper.aurelglyph_icon(
      "settings",
      "class" => "custom-icon",
      "aria-hidden" => "true",
      "aria-label" => "Spoofed",
      "data-icon" => "evil",
      "role" => "presentation",
      "title" => "Spoofed"
    )
    search = helper.aurelglyph_search_field(
      name: "query",
      label: "Search",
      value: "safe",
      placeholder: "Find systems",
      "name" => "evil",
      "placeholder" => "Spoofed",
      "type" => "email",
      "value" => "unsafe"
    )
    card = helper.aurelglyph_card(title: "Status", "class" => "custom-card") { "Operational" }
    duplicate_spellings = helper.aurelglyph_menu(
      label: "Duplicate spellings",
      items: [{ label: "Open" }],
      **{
        id: "canonical-menu",
        "id" => "spoofed-menu",
        class: "preferred-class",
        "class" => "discarded-class"
      }
    )
    duplicate_aria = helper.aurelglyph_dialog(
      "Duplicate ARIA spellings",
      **{
        :"aria-labelledby" => "discarded-label",
        "aria-labelledby" => "preferred-label"
      }
    ) { "Dialog body" }
    duplicate_sheet_aria = helper.aurelglyph_sheet(
      "Duplicate sheet ARIA",
      **{
        "aria-labelledby" => "direct-sheet-label",
        aria: { labelledby: "nested-sheet-label" }
      }
    ) { "Sheet body" }

    assert_equal 1, row.scan(/data-selected=/).length
    assert_equal 1, row.scan(/aria-selected=/).length
    assert_includes row, 'data-selected="true"'
    assert_includes row, 'aria-selected="true"'
    assert_equal 1, progress.scan(/aria-label=/).length
    assert_equal 1, progress.scan(/aria-valuenow=/).length
    assert_equal 1, progress.scan(/aria-valuemax=/).length
    assert_includes progress, 'aria-label="Progress"'
    assert_includes progress, 'aria-valuenow="5"'
    assert_includes progress, 'aria-valuemax="10"'
    assert_equal 1, radios.scan(/data-busy=/).length
    assert_equal 1, radios.scan(/data-invalid=/).length
    fieldset = radios[/\A<fieldset[^>]*>/]
    assert_equal 1, fieldset.scan(/aria-busy=/).length
    assert_equal 1, fieldset.scan(/aria-invalid=/).length
    assert_includes radios, 'data-busy="true"'
    assert_includes radios, 'aria-invalid="true"'
    refute_match(/\A<fieldset[^>]*disabled=/, radios)
    refute_includes menu, "bad-id"
    refute_includes menu, 'role="link"'
    refute_includes menu, 'type="submit"'
    assert_equal 1, menu.scan(/data-aurelglyph-menu=/).length
    assert_equal 1, menu.scan(/data-open=/).length
    assert_equal 1, menu.scan(/data-placement=/).length
    refute_includes menu, "spoofed"
    assert_equal 1, menu.scan(/role="menuitem"/).length
    refute_includes menu, 'role="option"'
    refute_includes combobox, "bad-input"
    refute_includes combobox, 'role="searchbox"'
    refute_includes combobox, 'type="email"'
    refute_includes combobox, "Spoofed placeholder"
    assert_includes combobox, 'placeholder="Search systems"'
    refute_includes combobox, 'aria-activedescendant="missing-option"'
    assert_equal 1, combobox.scan(/role="combobox"/).length
    assert_equal 1, spinner.scan(/role=/).length
    assert_includes spinner, 'role="status"'
    assert_equal 1, group.scan(/role=/).length
    assert_includes group, 'role="group"'
    refute_includes group, "aria-orientation"
    refute_includes icon_button, 'disabled="disabled"'
    assert_equal 1, icon_button.scan(/type=/).length
    assert_includes icon_button, 'type="button"'
    refute_includes disabled_icon_link, "href="
    assert_equal 1, disabled_icon_link.scan(/tabindex=/).length
    assert_includes disabled_icon_link, 'tabindex="-1"'
    assert_equal 1, enabled_icon_link.scan(/href=/).length
    assert_includes enabled_icon_link, 'href="/settings"'
    refute_includes enabled_icon_link, "/evil"
    refute_includes enabled_icon_link, "aria-disabled"
    assert_equal 1, tooltip_link.scan(/href=/).length
    assert_includes tooltip_link, 'href="/settings"'
    refute_includes tooltip_link, "/evil"
    refute_includes disabled_link_menu, "href="
    refute_includes disabled_link_menu, "name="
    assert_equal 1, disabled_link_menu.scan(/tabindex=/).length
    assert_includes disabled_link_menu, 'aria-disabled="true"'
    refute_includes disabled_command_link, "href="
    refute_includes disabled_command_link, "name="
    assert_equal 1, disabled_command_link.scan(/tabindex=/).length
    assert_includes disabled_command_link, 'aria-disabled="true"'
    refute_match(/<input[^>]*\schecked=/, unchecked_checkbox)
    refute_match(/<input[^>]*\schecked=/, unchecked_switch)
    assert_match(/\A<div[^>]*class="ag-tabs custom-tabs"/, tabs)
    assert_match(/\A<span[^>]*class="ag-icon custom-icon"/, icon)
    assert_equal 1, icon.scan(/data-icon=/).length
    assert_includes icon, 'data-icon="settings"'
    assert_includes icon, 'aria-label="Settings"'
    assert_includes icon, 'role="img"'
    refute_includes icon, "Spoofed"
    assert_equal 1, search.scan(/name=/).length
    assert_equal 1, search.scan(/placeholder=/).length
    assert_equal 1, search.scan(/type=/).length
    assert_equal 1, search.scan(/value=/).length
    assert_includes search, 'name="query"'
    assert_includes search, 'placeholder="Find systems"'
    assert_includes search, 'type="search"'
    assert_includes search, 'value="safe"'
    assert_match(/\A<section[^>]*class="ag-card custom-card"/, card)
    duplicate_root = duplicate_spellings[/\A<div[^>]*>/]
    assert_equal 1, duplicate_root.scan(/\sid=/).length
    assert_includes duplicate_root, 'id="canonical-menu"'
    refute_includes duplicate_spellings, "spoofed-menu"
    assert_includes duplicate_root, 'class="ag-menu preferred-class"'
    refute_includes duplicate_spellings, "discarded-class"
    dialog_root = duplicate_aria[/\A<dialog[^>]*>/]
    assert_equal 1, dialog_root.scan(/aria-labelledby=/).length
    assert_includes dialog_root, 'aria-labelledby="preferred-label"'
    refute_includes duplicate_aria, "discarded-label"
    sheet_root = duplicate_sheet_aria[/\A<dialog[^>]*>/]
    assert_equal 1, sheet_root.scan(/aria-labelledby=/).length
    assert_includes sheet_root, 'aria-labelledby="direct-sheet-label"'
    refute_includes duplicate_sheet_aria, "nested-sheet-label"
  end

  def test_legacy_helpers_reserve_computed_open_role_and_accessible_names
    helper = view_context
    disclosure = helper.aurelglyph_expandable_section(
      "Details",
      **{ open: false, "open" => true }
    ) { "Body" }
    toolbar = helper.aurelglyph_toolbar(
      label: "Tools",
      **{ role: "group", "role" => "presentation", aria: { label: "Spoofed" }, "aria-label" => "Spoofed direct" }
    ) { "Controls" }
    tab_bar = helper.aurelglyph_tab_bar(
      [{ id: "work", label: "Work" }],
      label: "Primary",
      **{ aria: { label: "Spoofed" }, "aria-label" => "Spoofed direct" }
    )
    alert = helper.aurelglyph_alert("Notice", role: "presentation", "role" => "none") { "Body" }
    avatar = helper.aurelglyph_avatar(
      "Ajit Chakrapani",
      role: "presentation",
      "role" => "none",
      aria: { label: "Spoofed" },
      "aria-label" => "Spoofed direct"
    )
    breadcrumbs = helper.aurelglyph_breadcrumbs(
      [{ label: "Home", current: true }],
      label: "Breadcrumb",
      aria: { label: "Spoofed" },
      "aria-label" => "Spoofed direct"
    )
    toast = helper.aurelglyph_toast("Saved", role: "presentation", "role" => "none") { "Body" }
    skeleton = helper.aurelglyph_skeleton(
      label: "Loading systems",
      role: "presentation",
      "role" => "none",
      aria: { label: "Spoofed" },
      "aria-label" => "Spoofed direct"
    )

    refute_match(/\A<details[^>]*\sopen=/, disclosure)
    {
      toolbar => ["div", 'role="toolbar"', 'aria-label="Tools"'],
      tab_bar => ["nav", nil, 'aria-label="Primary"'],
      alert => ["div", 'role="status"', nil],
      avatar => ["span", 'role="img"', 'aria-label="Ajit Chakrapani"'],
      breadcrumbs => ["nav", nil, 'aria-label="Breadcrumb"'],
      toast => ["div", 'role="status"', nil],
      skeleton => ["span", 'role="status"', 'aria-label="Loading systems"']
    }.each do |html, (tag_name, expected_role, expected_label)|
      root = html[/\A<#{tag_name}[^>]*>/]
      if expected_role
        assert_equal 1, root.scan(/\srole=/).length
        assert_includes root, expected_role
      end
      if expected_label
        assert_equal 1, root.scan(/aria-label=/).length
        assert_includes root, expected_label
      end
      refute_includes root, "Spoofed"
      refute_includes root, 'role="presentation"'
      refute_includes root, 'role="none"'
    end
  end

  def test_combobox_normalizes_stale_and_disabled_values_and_names_its_listbox
    helper = view_context
    options = [
      { label: "Disabled system", value: "disabled", disabled: true },
      { label: "Active system", value: "active" }
    ]
    stale = helper.aurelglyph_combobox(name: "system", label: "System", options: options, value: "missing")
    disabled = helper.aurelglyph_combobox(name: "system", label: "System", options: options, value: "disabled")
    active = helper.aurelglyph_combobox(name: "system", label: "System", options: options, value: "active")
    hidden_value = lambda do |html|
      html.scan(/<input[^>]*>/).find { |tag| tag.include?('data-aurelglyph-combobox-value=""') }
    end

    [stale, disabled, active].each do |html|
      listbox = html.scan(/<div[^>]*>/).find { |tag| tag.include?('role="listbox"') }
      assert_includes listbox, 'aria-label="System"'
    end
    refute_match(/\svalue=/, hidden_value.call(stale))
    refute_match(/\svalue=/, hidden_value.call(disabled))
    assert_includes hidden_value.call(active), 'value="active"'
    disabled_option = disabled.scan(/<div[^>]*>/).find { |tag| tag.include?('data-value="disabled"') }
    refute_includes disabled_option, "is-selected"
    assert_includes disabled_option, 'aria-selected="false"'
    active_option = active.scan(/<div[^>]*>/).find { |tag| tag.include?('data-value="active"') }
    assert_includes active_option, "is-selected"
    assert_includes active_option, 'aria-selected="true"'
  end

  def test_selection_and_menu_checked_state_omit_invalid_successful_values
    helper = view_context
    segmented = helper.aurelglyph_segmented_control(
      [
        { id: "one", label: "One", disabled: true },
        { id: "two", label: "Two", disabled: true }
      ],
      active: "one",
      name: "choice"
    )
    checkbox_menu = helper.aurelglyph_menu(
      label: "Display",
      items: [{ label: "Grid", role: "menuitemcheckbox", checked: "mixed" }]
    )
    radio_menu = helper.aurelglyph_menu(
      label: "Density",
      items: [{ label: "Compact", role: "menuitemradio", checked: nil }]
    )

    refute_includes segmented, 'name="choice"'
    assert_includes checkbox_menu, 'aria-checked="mixed"'
    assert_includes radio_menu, 'aria-checked="false"'
    assert_raises(ArgumentError) do
      helper.aurelglyph_menu(
        label: "Density",
        items: [{ label: "Compact", role: "menuitemradio", checked: "mixed" }]
      )
    end
    assert_raises(ArgumentError) do
      helper.aurelglyph_menu(
        label: "Display",
        items: [{ label: "Grid", role: "menuitemcheckbox", checked: "yes" }]
      )
    end
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
