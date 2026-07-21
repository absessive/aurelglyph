# frozen_string_literal: true

require "action_view"
require "securerandom"

module Aurelglyph
  module Rails
    module Helper
      include ActionView::Helpers::TagHelper

      ICON_GLYPHS = {
        "home" => "M4 11.5 12 4l8 7.5V20h-5v-5H9v5H4v-8.5Z",
        "dashboard" => "M4 5h16v14H4V5Zm3 10h3V8H7v7Zm5 0h5v-4h-5v4Zm0-6h5V8h-5v1Z",
        "user" => "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
        "users" => "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0 0-6m0 9a5 5 0 0 1 5 5",
        "bell" => "M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4L6 17Zm4 0a2 2 0 0 0 4 0",
        "mail" => "M4 6h16v12H4V6Zm0 2 8 5 8-5",
        "calendar" => "M5 6h14v14H5V6Zm0 4h14M8 4v4m8-4v4",
        "clock" => "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12v5l3 2",
        "plus" => "M12 5v14M5 12h14",
        "minus" => "M5 12h14",
        "upload" => "M12 3v12m0-12 4 4m-4-4-4 4M5 15v4h14v-4",
        "download" => "M12 3v12m0 0 4-4m-4 4-4-4M5 19h14",
        "attachment" => "M8 12.5 13.8 6.7a3 3 0 1 1 4.2 4.2l-7.4 7.4a5 5 0 0 1-7.1-7.1l7.1-7.1",
        "share" => "M12 4v10m0-10 4 4m-4-4-4 4M5 11v8h14v-8",
        "send" => "M4 12 20 4l-5 16-3-7-8-1Zm8 1 8-9",
        "copy" => "M8 8h10v12H8V8Zm-2 8H4V4h10v2",
        "save" => "M5 5h12l2 2v12H5V5Zm3 0v6h8V5M8 19v-5h8v5",
        "lock" => "M6 11h12v9H6v-9Zm3 0V8a3 3 0 0 1 6 0v3",
        "unlock" => "M6 11h12v9H6v-9Zm3 0V8a3 3 0 0 1 5.5-1.7",
        "shield" => "M12 3 20 6v5c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3Z",
        "eye" => "M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "eye-off" => "M4 4l16 16M9.2 6.6A9.6 9.6 0 0 1 12 6c5.8 0 9 6 9 6a16 16 0 0 1-2.2 3M6.4 8.4A16 16 0 0 0 3 12s3.2 6 9 6c1 0 1.9-.2 2.8-.5",
        "search" => "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4",
        "filter" => "M4 6h16l-6 7v5l-4 2v-7L4 6Z",
        "sort" => "M8 5v14m0 0-3-3m3 3 3-3m5 3V5m0 0-3 3m3-3 3 3",
        "menu" => "M4 7h16M4 12h16M4 17h16",
        "more-horizontal" => "M6 12h.01M12 12h.01M18 12h.01",
        "more-vertical" => "M12 6h.01M12 12h.01M12 18h.01",
        "settings" => "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v3m0 11v3m8.5-8.5h-3m-11 0h-3m14.4-5.9-2.1 2.1M8.2 15.8l-2.1 2.1m0-11.8 2.1 2.1m7.6 7.6 2.1 2.1",
        "edit" => "M5 17.5V20h2.5L18.8 8.7l-2.5-2.5L5 17.5Zm10-10 2.5 2.5",
        "delete" => "M6 7h12M9 7V5h6v2m-7 0 1 13h6l1-13",
        "close" => "M6 6l12 12M18 6 6 18",
        "back" => "M15 6 9 12l6 6",
        "forward" => "m9 6 6 6-6 6",
        "chevron-down" => "m6 9 6 6 6-6",
        "chevron-up" => "m6 15 6-6 6 6",
        "external-link" => "M10 6H5v13h13v-5M14 5h5v5m0-5-9 9",
        "refresh" => "M19 8a7 7 0 0 0-12-2l-2 2m0 0h5M5 8V3m0 13a7 7 0 0 0 12 2l2-2m0 0h-5m5 0v5",
        "sync" => "M17 4h4v4m0-4-5 5a6 6 0 0 0-10 3m1 8H3v-4m0 4 5-5a6 6 0 0 0 10-3",
        "check" => "m5 12 4 4L19 6",
        "warning" => "M12 4 21 20H3L12 4Zm0 5v5m0 3h.01",
        "info" => "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-9v5m0-8h.01",
        "success" => "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-4-8 3 3 5-6",
        "cloud" => "M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 2A3 3 0 0 0 7 18Z",
        "database" => "M5 7c0-2 14-2 14 0v10c0 2-14 2-14 0V7Zm0 0c0 2 14 2 14 0M5 12c0 2 14 2 14 0",
        "server" => "M4 5h16v6H4V5Zm0 8h16v6H4v-6Zm3-5h.01M7 16h.01",
        "terminal" => "M4 5h16v14H4V5Zm4 5 3 2-3 2m5 1h4",
        "code" => "m9 8-4 4 4 4m6-8 4 4-4 4m-2-10-2 12",
        "archive" => "M4 6h16v4H4V6Zm2 4v10h12V10m-8 4h4",
        "star" => "m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 4Z",
        "heart" => "M12 20s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.2-8 10-8 10Z",
        "bookmark" => "M6 4h12v16l-6-3-6 3V4Z",
        "tag" => "M4 6v6l8 8 8-8-8-8H6a2 2 0 0 0-2 2Zm5 2h.01",
        "map-pin" => "M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "location" => "M12 3v3m0 12v3m9-9h-3M6 12H3m15.4-6.4-2.1 2.1M7.7 16.3l-2.1 2.1m0-12.8 2.1 2.1m8.6 8.6 2.1 2.1M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "phone" => "M7 4h10v16H7V4Zm3 2h4M11 18h2",
        "message" => "M4 5h16v11H9l-5 4V5Z",
        "chat" => "M5 6h14v9H9l-4 4V6Zm4 3h6m-6 3h4",
        "grid" => "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
        "list" => "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
        "columns" => "M4 5h16v14H4V5Zm8 0v14",
        "table" => "M4 5h16v14H4V5Zm0 5h16M9 5v14m6-14v14",
        "layout" => "M4 5h16v14H4V5Zm0 5h16m-6 0v9",
        "panel" => "M4 5h16v14H4V5Zm4 0v14m0-9h12",
        "sidebar" => "M4 5h16v14H4V5Zm5 0v14",
        "command" => "M8 8H6a2 2 0 1 1 2-2v12a2 2 0 1 1-2-2h12a2 2 0 1 1-2 2V6a2 2 0 1 1 2 2H8Z",
        "package" => "M4 8 12 4l8 4v9l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v9",
        "cube" => "M12 3 20 8v8l-8 5-8-5V8l8-5Zm0 0v8m0 0 8-3m-8 3-8-3",
        "layers" => "m12 4 9 5-9 5-9-5 9-5Zm-7 9 7 4 7-4M5 17l7 4 7-4",
        "workflow" => "M5 7h5v5H5V7Zm9 5h5v5h-5v-5Zm-4-2h2a2 2 0 0 1 2 2m-9 0v2a2 2 0 0 0 2 2h5",
        "branch" => "M7 5v8a4 4 0 0 0 4 4h6M17 13l4 4-4 4M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "git-branch" => "M7 4v10a4 4 0 0 0 4 4h3M17 4v3a5 5 0 0 1-5 5H7M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "link" => "M10 8h4m-5 8H7a4 4 0 0 1 0-8h3m5 8h2a4 4 0 0 0 0-8h-3",
        "unlink" => "M4 4l16 16M10 8h4m-5 8H7a4 4 0 0 1-.8-7.9M15 16h2a4 4 0 0 0 2.6-7",
        "log-in" => "M4 4h8v16H4M12 12h8m0 0-3-3m3 3-3 3",
        "log-out" => "M12 4h8v16h-8M4 12h10m0 0-3-3m3 3-3 3",
        "power" => "M12 3v8m5.7-5.7a8 8 0 1 1-11.4 0",
        "play" => "M8 5v14l11-7L8 5Z",
        "pause" => "M7 5h4v14H7V5Zm6 0h4v14h-4V5Z",
        "stop" => "M7 7h10v10H7V7Z",
        "record" => "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
        "microphone" => "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 17v4",
        "camera" => "M4 8h4l1.5-2h5L16 8h4v10H4V8Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "video" => "M4 7h11v10H4V7Zm11 3 5-3v10l-5-3",
        "image" => "M4 6h16v12H4V6Zm3 9 3-3 2 2 3-4 3 5M8 9h.01",
        "music" => "M9 18a3 3 0 1 1-2-2.8V6l11-2v10.5a3 3 0 1 1-2-2.8V8L9 9.4V18Z",
        "volume" => "M4 10v4h4l5 4V6l-5 4H4Zm12-1a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12",
        "mute" => "M4 10v4h4l5 4V6l-5 4H4Zm12 0 5 5m0-5-5 5",
        "wallet" => "M4 7h15v12H4V7Zm0 0 3-3h10v3m-1 6h3",
        "credit-card" => "M4 6h16v12H4V6Zm0 4h16M7 15h4",
        "cart" => "M4 5h2l2 10h9l3-7H7m2 11h.01M17 19h.01",
        "receipt" => "M6 4h12v16l-3-2-3 2-3-2-3 2V4Zm3 5h6m-6 4h6",
        "chart-line" => "M4 18h16M6 15l4-4 3 3 5-7",
        "chart-bar" => "M5 19V9h4v10m3 0V5h4v14m3 0v-7h2",
        "activity" => "M3 12h4l2-6 4 12 2-6h6",
        "spark" => "M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Zm6 12 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z",
        "bolt" => "M13 3 5 14h6l-1 7 8-11h-6l1-7Z",
        "target" => "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-4h.01",
        "compass" => "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3-11-2 5-5 2 2-5 5-2Z",
        "thumbs-up" => "M7 10v10H4V10h3Zm3 10h6.5a2 2 0 0 0 2-1.7l1-6A2 2 0 0 0 17.5 10H14l1-4a2 2 0 0 0-3.5-1.7L8 10v8a2 2 0 0 0 2 2Z",
        "thumbs-down" => "M7 14V4H4v10h3Zm3-10h6.5a2 2 0 0 1 2 1.7l1 6a2 2 0 0 1-2 2.3H14l1 4a2 2 0 0 1-3.5 1.7L8 14V6a2 2 0 0 1 2-2Z",
        "help" => "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-2-10a2 2 0 1 1 3.3 1.5c-.9.8-1.3 1.1-1.3 2.5m0 3h.01",
        "notification" => "M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4L6 17Zm4 0a2 2 0 0 0 4 0M18 5h.01",
        "expand" => "M4 9V4h5M4 4l6 6m10-1V4h-5m5 0-6 6M4 15v5h5m-5 0 6-6m10 1v5h-5m5 0-6-6",
        "contract" => "M10 4v6H4m6 0L4 4m10 0v6h6m-6 0 6-6M10 20v-6H4m6 0-6 6m10 0v-6h6m-6 0 6 6"
      }.freeze

      ICON_NAMES = ICON_GLYPHS.keys.freeze

      def aurelglyph_token(name)
        TOKENS.fetch(name) do
          raise KeyError, "Unknown Aurelglyph token: #{name}"
        end
      end

      def aurelglyph_icon(name, title: nil, decorative: false, **attributes)
        icon_name = name.to_s
        glyph = ICON_GLYPHS.fetch(icon_name) do
          raise KeyError, "Unknown Aurelglyph icon: #{icon_name}"
        end

        html_attributes = attributes.dup
        classes = class_names_for("ag-icon", html_attributes.delete(:class))
        label = title || icon_name.tr("-", " ").split.map(&:capitalize).join(" ")
        svg = content_tag(
          :svg,
          tag.path(d: glyph),
          "aria-hidden": "true",
          focusable: "false",
          viewBox: "0 0 24 24"
        )

        content_tag(
          :span,
          svg,
          html_attributes.merge(
            class: classes,
            "data-icon": icon_name,
            "aria-hidden": decorative ? "true" : nil,
            "aria-label": decorative ? nil : label,
            role: decorative ? nil : "img",
            title: decorative ? nil : title
          ).compact
        )
      end

      def aurelglyph_expandable_section(title, eyebrow: nil, open: false, **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-disclosure", html_attributes.delete(:class))
        heading = content_tag(
          :span,
          safe_join([
            eyebrow && content_tag(:span, eyebrow, class: "ag-disclosure__eyebrow"),
            content_tag(:span, title, class: "ag-disclosure__title")
          ].compact),
          class: "ag-disclosure__heading"
        )
        trigger = content_tag(
          :summary,
          safe_join([heading, aurelglyph_icon("chevron-down", decorative: true, class: "ag-disclosure__icon")]),
          class: "ag-disclosure__trigger"
        )
        panel = content_tag(
          :div,
          content_tag(:div, capture_content(&block), class: "ag-disclosure__panel-inner"),
          class: "ag-disclosure__panel"
        )

        content_tag(:details, safe_join([trigger, panel]), html_attributes.merge(class: classes, open: open ? true : nil).compact)
      end

      def aurelglyph_card(title: nil, eyebrow: nil, **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-card", html_attributes.delete(:class))
        header = if eyebrow || title
          content_tag(
            :header,
            safe_join([
              eyebrow && content_tag(:p, eyebrow, class: "ag-card__eyebrow"),
              title && content_tag(:h2, title, class: "ag-card__title")
            ].compact),
            class: "ag-card__header"
          )
        end

        content_tag(
          :section,
          safe_join([header, content_tag(:div, capture_content(&block), class: "ag-card__body")].compact),
          html_attributes.merge(class: classes)
        )
      end

      def aurelglyph_list_section(title: nil, eyebrow: nil, **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-list-section", html_attributes.delete(:class))
        header = if eyebrow || title
          content_tag(
            :div,
            safe_join([
              eyebrow && content_tag(:p, eyebrow, class: "ag-list-section__eyebrow"),
              title && content_tag(:h2, title, class: "ag-list-section__title")
            ].compact),
            class: "ag-list-section__header"
          )
        end

        content_tag(
          :section,
          safe_join([header, content_tag(:ul, capture_content(&block), class: "ag-list-section__list")].compact),
          html_attributes.merge(class: classes)
        )
      end

      def aurelglyph_list_row(title, description: nil, icon: nil, selected: false, trailing: nil, **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-list-row", selected && "is-selected", html_attributes.delete(:class))
        icon_html = if icon
          content_tag(:span, aurelglyph_icon(icon, decorative: true), class: "ag-list-row__icon", "aria-hidden": "true")
        end
        copy = content_tag(
          :span,
          safe_join([
            content_tag(:span, title, class: "ag-list-row__title"),
            description && content_tag(:span, description, class: "ag-list-row__description")
          ].compact),
          class: "ag-list-row__content"
        )
        trailing_html = trailing && content_tag(:span, trailing, class: "ag-list-row__trailing")

        content_tag(
          :li,
          safe_join([icon_html, copy, trailing_html].compact),
          html_attributes.merge(class: classes, "aria-selected": selected ? "true" : nil).compact
        )
      end

      def aurelglyph_tab_bar(items, active: nil, label: "Primary", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-tab-bar", html_attributes.delete(:class))
        items_html = items.map do |item|
          id = item.fetch(:id).to_s
          icon = item[:icon] && aurelglyph_icon(item[:icon], decorative: true, class: "ag-tab-bar__icon")
          text = content_tag(:span, item.fetch(:label), class: "ag-tab-bar__label")
          content_tag(
            :a,
            safe_join([icon, text].compact),
            class: class_names_for("ag-tab-bar__item", id == active.to_s && "is-active"),
            href: item.fetch(:href, "#"),
            "aria-current": id == active.to_s ? "page" : nil
          )
        end

        content_tag(:nav, safe_join(items_html), html_attributes.merge(class: classes, "aria-label": label))
      end

      def aurelglyph_search_field(name:, label:, value: nil, placeholder: "Search", **attributes)
        input_attributes = attributes.dup
        input_classes = class_names_for("ag-search__input", input_attributes.delete(:class))
        input = tag.input(
          **input_attributes.merge(
            id: name,
            class: input_classes,
            name: name,
            placeholder: placeholder,
            type: "search",
            value: value
          ).compact
        )
        control = content_tag(
          :div,
          safe_join([aurelglyph_icon("search", decorative: true, class: "ag-search__icon"), input]),
          class: "ag-search__control"
        )

        content_tag(
          :div,
          safe_join([content_tag(:label, label, class: "ag-search__label", for: name), control]),
          class: "ag-search"
        )
      end

      def aurelglyph_switch(name:, label:, checked: false, description: nil, **attributes)
        input_attributes = attributes.dup
        input_classes = class_names_for("ag-switch__input", input_attributes.delete(:class))
        copy = content_tag(
          :span,
          safe_join([
            content_tag(:span, label, class: "ag-switch__label"),
            description && content_tag(:span, description, class: "ag-switch__description")
          ].compact),
          class: "ag-switch__copy"
        )
        input = tag.input(
          **input_attributes.merge(
            id: name,
            checked: checked ? true : nil,
            class: input_classes,
            name: name,
            role: "switch",
            type: "checkbox"
          ).compact
        )
        track = content_tag(
          :span,
          content_tag(:span, nil, class: "ag-switch__thumb"),
          class: "ag-switch__track",
          "aria-hidden": "true"
        )

        content_tag(:label, safe_join([copy, input, track]), class: "ag-switch", for: name)
      end

      def aurelglyph_toolbar(label: "Toolbar", **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-toolbar", html_attributes.delete(:class))

        content_tag(
          :div,
          capture_content(&block),
          html_attributes.merge(class: classes, role: "toolbar", "aria-label": label)
        )
      end

      def aurelglyph_navigation_stack(title: nil, **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-nav-stack", html_attributes.delete(:class))
        title_html = title && content_tag(:h1, title, class: "ag-nav-stack__title")
        pages = content_tag(:div, capture_content(&block), class: "ag-nav-stack__pages")

        content_tag(:main, safe_join([title_html, pages].compact), html_attributes.merge(class: classes))
      end

      def aurelglyph_navigation_page(title, actions: nil, **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-nav-page", html_attributes.delete(:class))
        actions_html = actions && content_tag(:div, actions, class: "ag-nav-page__actions")
        header = content_tag(
          :header,
          safe_join([content_tag(:h2, title, class: "ag-nav-page__title"), actions_html].compact),
          class: "ag-nav-page__header"
        )
        body = content_tag(:div, capture_content(&block), class: "ag-nav-page__body")

        content_tag(:section, safe_join([header, body]), html_attributes.merge(class: classes))
      end

      def aurelglyph_sheet(title, open: false, actions: nil, **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-sheet", extract_html_attribute!(html_attributes, :class))
        sheet_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-sheet")
        title_id = unique_dom_id("ag-sheet-title")
        labelled_by = extract_html_attribute!(html_attributes, :"aria-labelledby")
        %i[aria-modal data-aurelglyph-sheet data-open open tabindex].each do |attribute|
          extract_html_attribute!(html_attributes, attribute)
        end
        aria_attributes = extract_html_attribute!(html_attributes, :aria)
        if aria_attributes.is_a?(Hash)
          aria_attributes = aria_attributes.dup
          %i[labelledby labelled_by labelled-by].each do |attribute|
            labelled_by ||= extract_html_attribute!(aria_attributes, attribute)
          end
          extract_html_attribute!(aria_attributes, :modal)
        end
        if aria_attributes && (!aria_attributes.respond_to?(:empty?) || !aria_attributes.empty?)
          html_attributes[:aria] = aria_attributes
        end
        labelled_by ||= title_id
        data_attributes = extract_html_attribute!(html_attributes, :data)
        if data_attributes.is_a?(Hash)
          data_attributes = data_attributes.dup
          %i[open aurelglyph_sheet aurelglyph-sheet].each do |attribute|
            extract_html_attribute!(data_attributes, attribute)
          end
        end
        if data_attributes && (!data_attributes.respond_to?(:empty?) || !data_attributes.empty?)
          html_attributes[:data] = data_attributes
        end
        actions_html = actions && content_tag(:div, actions, class: "ag-sheet__actions")
        header = content_tag(
          :header,
          safe_join([content_tag(:h2, title, class: "ag-sheet__title", id: title_id), actions_html].compact),
          class: "ag-sheet__header"
        )
        body = content_tag(:div, capture_content(&block), class: "ag-sheet__body")
        surface = content_tag(:div, safe_join([header, body]), class: "ag-sheet__surface")

        content_tag(
          :dialog,
          surface,
          html_attributes.merge(
            id: sheet_id,
            class: classes,
            tabindex: -1,
            "aria-labelledby": labelled_by,
            "data-aurelglyph-sheet": "",
            "data-open": open ? "true" : "false"
          )
        )
      end

      def aurelglyph_segmented_control(items, active:, label: "Options", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-segmented", html_attributes.delete(:class))
        items_html = items.map do |item|
          id = item.fetch(:id).to_s
          content_tag(
            :button,
            item.fetch(:label),
            class: class_names_for("ag-segmented__item", id == active.to_s && "is-active"),
            type: "button",
            role: "radio",
            "aria-checked": id == active.to_s ? "true" : "false"
          )
        end

        content_tag(
          :div,
          safe_join(items_html),
          html_attributes.merge(class: classes, role: "radiogroup", "aria-label": label)
        )
      end

      def aurelglyph_select(name:, label:, options:, selected: nil, help_text: nil, **attributes)
        select_attributes = attributes.dup
        classes = class_names_for("ag-select__input", select_attributes.delete(:class))
        options_html = options.map do |option|
          value = option.fetch(:value).to_s
          content_tag(:option, option.fetch(:label), value: value, selected: value == selected.to_s ? true : nil)
        end
        help_id = "#{name}-help"
        select = content_tag(
          :select,
          safe_join(options_html),
          select_attributes.merge(
            id: name,
            name: name,
            class: classes,
            "aria-describedby": help_text ? help_id : nil
          ).compact
        )
        control = content_tag(:span, select, class: "ag-select__control")
        help = help_text && content_tag(:span, help_text, class: "ag-select__help", id: help_id)

        content_tag(
          :label,
          safe_join([content_tag(:span, label, class: "ag-select__label"), control, help].compact),
          class: "ag-select"
        )
      end

      def aurelglyph_alert(title, tone: "info", **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-alert", "ag-alert--#{tone}", html_attributes.delete(:class))
        role = %w[danger warning].include?(tone.to_s) ? "alert" : "status"
        body = block && content_tag(:div, capture_content(&block), class: "ag-alert__body")
        copy = content_tag(
          :div,
          safe_join([content_tag(:strong, title, class: "ag-alert__title"), body].compact),
          class: "ag-alert__content"
        )

        content_tag(
          :div,
          safe_join([content_tag(:span, nil, class: "ag-alert__dot", "aria-hidden": "true"), copy]),
          html_attributes.merge(class: classes, role: role)
        )
      end

      def aurelglyph_empty_state(title, icon: "archive", **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-empty-state", html_attributes.delete(:class))
        icon_html = content_tag(
          :span,
          aurelglyph_icon(icon, decorative: true),
          class: "ag-empty-state__icon",
          "aria-hidden": "true"
        )
        body = block && content_tag(:div, capture_content(&block), class: "ag-empty-state__body")

        content_tag(
          :section,
          safe_join([icon_html, content_tag(:h2, title, class: "ag-empty-state__title"), body].compact),
          html_attributes.merge(class: classes)
        )
      end

      def aurelglyph_avatar(name, initials: nil, src: nil, **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-avatar", html_attributes.delete(:class))
        content = if src
          tag.img(alt: "", class: "ag-avatar__image", src: src)
        else
          text = initials || name.split(/\s+/).first(2).map { |part| part[0]&.upcase }.join
          content_tag(:span, text, class: "ag-avatar__initials")
        end

        content_tag(
          :span,
          content,
          html_attributes.merge(class: classes, role: "img", "aria-label": name)
        )
      end

      def aurelglyph_badge(label, tone: "neutral", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-badge", "ag-badge--#{tone}", html_attributes.delete(:class))

        content_tag(:span, label, html_attributes.merge(class: classes))
      end

      def aurelglyph_breadcrumbs(items, label: "Breadcrumb", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-breadcrumbs", html_attributes.delete(:class))
        items_html = items.map do |item|
          content = if item[:current]
            content_tag(:span, item.fetch(:label), class: "ag-breadcrumbs__current", "aria-current": "page")
          else
            content_tag(:a, item.fetch(:label), class: "ag-breadcrumbs__link", href: item.fetch(:href, "#"))
          end
          content_tag(:li, content, class: "ag-breadcrumbs__item")
        end

        content_tag(
          :nav,
          content_tag(:ol, safe_join(items_html), class: "ag-breadcrumbs__list"),
          html_attributes.merge(class: classes, "aria-label": label)
        )
      end

      def aurelglyph_tabs(items, active:, label: "Sections", **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-tabs", html_attributes.delete(:class))
        tabs = items.map do |item|
          id = item.fetch(:id).to_s
          content_tag(
            :button,
            item.fetch(:label),
            class: class_names_for("ag-tabs__tab", id == active.to_s && "is-active"),
            id: "#{id}-tab",
            type: "button",
            role: "tab",
            "aria-selected": id == active.to_s ? "true" : "false",
            "aria-controls": "#{id}-panel"
          )
        end
        list = content_tag(:div, safe_join(tabs), class: "ag-tabs__list", role: "tablist", "aria-label": label)
        panel = if block
          content_tag(
            :div,
            capture_content(&block),
            class: "ag-tabs__panel",
            id: "#{active}-panel",
            role: "tabpanel",
            "aria-labelledby": "#{active}-tab"
          )
        end

        content_tag(:div, safe_join([list, panel].compact), html_attributes.merge(class: classes))
      end

      def aurelglyph_toast(title, tone: "info", **attributes, &block)
        html_attributes = attributes.dup
        classes = class_names_for("ag-toast", "ag-toast--#{tone}", html_attributes.delete(:class))
        body = block && content_tag(:div, capture_content(&block), class: "ag-toast__body")
        copy = content_tag(
          :div,
          safe_join([content_tag(:strong, title, class: "ag-toast__title"), body].compact),
          class: "ag-toast__content"
        )

        content_tag(
          :div,
          safe_join([content_tag(:span, nil, class: "ag-toast__dot", "aria-hidden": "true"), copy]),
          html_attributes.merge(class: classes, role: "status")
        )
      end

      def aurelglyph_progress(value:, max: 100, label: "Progress", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-progress", html_attributes.delete(:class))
        percent = [[(value.to_f / max.to_f) * 100, 0].max, 100].min
        bar = content_tag(:span, nil, class: "ag-progress__bar", style: "inline-size: #{percent}%")

        content_tag(
          :div,
          bar,
          html_attributes.merge(
            class: classes,
            role: "progressbar",
            "aria-label": label,
            "aria-valuemin": 0,
            "aria-valuemax": max,
            "aria-valuenow": value
          )
        )
      end

      def aurelglyph_skeleton(label: "Loading", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-skeleton", html_attributes.delete(:class))

        content_tag(
          :span,
          nil,
          html_attributes.merge(class: classes, role: "status", "aria-label": label)
        )
      end

      def aurelglyph_metric(label:, value:, delta: nil, **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-metric", html_attributes.delete(:class))
        delta_html = delta && content_tag(:span, delta, class: "ag-metric__delta")

        content_tag(
          :section,
          safe_join([
            content_tag(:p, label, class: "ag-metric__label"),
            content_tag(:strong, value, class: "ag-metric__value"),
            delta_html
          ].compact),
          html_attributes.merge(class: classes)
        )
      end

      def aurelglyph_data_table(columns:, rows:, **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-table-wrap", html_attributes.delete(:class))
        headers = columns.map { |column| content_tag(:th, column.fetch(:header), scope: "col") }
        body_rows = rows.map do |row|
          cells = columns.map { |column| content_tag(:td, row.fetch(column.fetch(:key))) }
          content_tag(:tr, safe_join(cells))
        end
        table = content_tag(
          :table,
          safe_join([
            content_tag(:thead, content_tag(:tr, safe_join(headers))),
            content_tag(:tbody, safe_join(body_rows))
          ]),
          class: "ag-table"
        )

        content_tag(:div, table, html_attributes.merge(class: classes))
      end

      def aurelglyph_pagination(current_page:, total_pages:, label: "Pagination", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-pagination", html_attributes.delete(:class))
        pages = (1..total_pages).map do |page|
          content_tag(
            :button,
            page,
            class: class_names_for("ag-pagination__page", page == current_page && "is-active"),
            type: "button",
            "aria-current": page == current_page ? "page" : nil
          )
        end

        content_tag(
          :nav,
          safe_join([
            content_tag(:button, "Previous", class: "ag-pagination__button", type: "button"),
            content_tag(:div, safe_join(pages), class: "ag-pagination__pages"),
            content_tag(:button, "Next", class: "ag-pagination__button", type: "button")
          ]),
          html_attributes.merge(class: classes, "aria-label": label)
        )
      end

      def aurelglyph_command_palette(items, label: "Command palette", placeholder: "Type a command", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-command-palette", html_attributes.delete(:class))
        search = content_tag(
          :label,
          safe_join([
            content_tag(:span, label, class: "ag-command-palette__label"),
            tag.input(class: "ag-command-palette__input", placeholder: placeholder, type: "search")
          ]),
          class: "ag-command-palette__search"
        )
        items_html = items.map do |item|
          icon = item[:icon] && aurelglyph_icon(item[:icon], decorative: true, class: "ag-command-palette__icon")
          shortcut = item[:shortcut] && content_tag(:kbd, item[:shortcut], class: "ag-command-palette__shortcut")
          content_tag(
            :button,
            safe_join([
              icon,
              content_tag(:span, item.fetch(:label), class: "ag-command-palette__item-label"),
              shortcut
            ].compact),
            class: "ag-command-palette__item",
            type: "button",
            role: "option"
          )
        end
        list = content_tag(:div, safe_join(items_html), class: "ag-command-palette__list", role: "listbox")

        content_tag(
          :div,
          safe_join([search, list]),
          html_attributes.merge(class: classes, role: "dialog", "aria-label": label)
        )
      end

      private

      def capture_content(&block)
        block ? capture(&block) : safe_join([])
      end

      def class_names_for(*classes)
        classes.flatten.compact.reject { |value| value == false || value.to_s.empty? }.join(" ")
      end

      def extract_html_attribute!(attributes, name)
        attributes.delete(name) || attributes.delete(name.to_s)
      end

      def unique_dom_id(prefix)
        "#{prefix}-#{SecureRandom.hex(8)}"
      end
    end
  end
end
