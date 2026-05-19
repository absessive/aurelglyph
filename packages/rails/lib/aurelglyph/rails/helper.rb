# frozen_string_literal: true

module Aurelglyph
  module Rails
    module Helper
      ICON_NAMES = %w[
        home dashboard user users bell mail calendar clock plus minus upload
        download attachment share send copy save lock unlock shield eye
        eye-off search filter sort menu more-horizontal more-vertical settings
        edit delete close back forward chevron-down chevron-up external-link
        refresh sync check warning info success cloud database server terminal
        code archive star heart bookmark tag map-pin location phone message chat
        grid list columns table layout panel sidebar command package cube layers
        workflow branch git-branch link unlink log-in log-out power play pause
        stop record microphone camera video image music volume mute wallet
        credit-card cart receipt chart-line chart-bar activity spark bolt target
        compass thumbs-up thumbs-down help notification expand contract
      ].freeze

      def aurelglyph_token(name)
        TOKENS.fetch(name) do
          raise KeyError, "Unknown Aurelglyph token: #{name}"
        end
      end

      def aurelglyph_icon(name, title: nil, decorative: false, **attributes)
        icon_name = name.to_s
        unless ICON_NAMES.include?(icon_name)
          raise KeyError, "Unknown Aurelglyph icon: #{icon_name}"
        end

        label = title || icon_name.split("-").map(&:capitalize).join(" ")
        classes = ["ag-icon", attributes.delete(:class)].compact.join(" ")
        html_attributes = attributes.merge(
          class: classes,
          "data-icon": icon_name,
          "aria-hidden": decorative ? "true" : nil,
          "aria-label": decorative ? nil : label,
          role: decorative ? nil : "img"
        ).compact

        attribute_string = html_attributes.map do |key, value|
          %(#{escape_html(key)}="#{escape_html(value)}")
        end.join(" ")

        %(<span #{attribute_string}></span>)
      end

      def aurelglyph_expandable_section(title, eyebrow: nil, open: false, **attributes, &block)
        classes = ["ag-disclosure", attributes.delete(:class)].compact.join(" ")
        html_attributes = attributes.merge(class: classes, open: open ? "open" : nil).compact
        attribute_string = html_attribute_string(html_attributes)
        content = block ? block.call.to_s : ""
        eyebrow_html = eyebrow ? %(<span class="ag-disclosure__eyebrow">#{escape_html(eyebrow)}</span>) : ""

        <<~HTML.strip
          <details #{attribute_string}>
            <summary class="ag-disclosure__trigger">
              <span class="ag-disclosure__heading">#{eyebrow_html}<span class="ag-disclosure__title">#{escape_html(title)}</span></span>
              <span class="ag-disclosure__icon" aria-hidden="true"></span>
            </summary>
            <div class="ag-disclosure__panel"><div class="ag-disclosure__panel-inner">#{content}</div></div>
          </details>
        HTML
      end

      def aurelglyph_card(title: nil, eyebrow: nil, **attributes, &block)
        classes = ["ag-card", attributes.delete(:class)].compact.join(" ")
        attribute_string = html_attribute_string(attributes.merge(class: classes))
        eyebrow_html = eyebrow ? %(<p class="ag-card__eyebrow">#{escape_html(eyebrow)}</p>) : ""
        title_html = title ? %(<h2 class="ag-card__title">#{escape_html(title)}</h2>) : ""
        header_html = (eyebrow || title) ? %(<header class="ag-card__header">#{eyebrow_html}#{title_html}</header>) : ""
        content = block ? block.call.to_s : ""

        %(<section #{attribute_string}>#{header_html}<div class="ag-card__body">#{content}</div></section>)
      end

      def aurelglyph_list_section(title: nil, eyebrow: nil, **attributes, &block)
        classes = ["ag-list-section", attributes.delete(:class)].compact.join(" ")
        attribute_string = html_attribute_string(attributes.merge(class: classes))
        eyebrow_html = eyebrow ? %(<p class="ag-list-section__eyebrow">#{escape_html(eyebrow)}</p>) : ""
        title_html = title ? %(<h2 class="ag-list-section__title">#{escape_html(title)}</h2>) : ""
        header_html = (eyebrow || title) ? %(<div class="ag-list-section__header">#{eyebrow_html}#{title_html}</div>) : ""
        content = block ? block.call.to_s : ""

        %(<section #{attribute_string}>#{header_html}<ul class="ag-list-section__list">#{content}</ul></section>)
      end

      def aurelglyph_list_row(title, description: nil, icon: nil, selected: false, trailing: nil, **attributes)
        classes = ["ag-list-row", selected ? "is-selected" : nil, attributes.delete(:class)].compact.join(" ")
        icon_html = icon ? %(<span class="ag-list-row__icon" aria-hidden="true">#{aurelglyph_icon(icon, decorative: true)}</span>) : ""
        description_html = description ? %(<span class="ag-list-row__description">#{escape_html(description)}</span>) : ""
        trailing_html = trailing ? %(<span class="ag-list-row__trailing">#{trailing}</span>) : ""
        html_attributes = attributes.merge(class: classes, "aria-selected": selected ? "true" : nil).compact

        <<~HTML.strip
          <li #{html_attribute_string(html_attributes)}>#{icon_html}<span class="ag-list-row__content"><span class="ag-list-row__title">#{escape_html(title)}</span>#{description_html}</span>#{trailing_html}</li>
        HTML
      end

      def aurelglyph_tab_bar(items, active: nil, label: "Primary", **attributes)
        classes = ["ag-tab-bar", attributes.delete(:class)].compact.join(" ")
        html_attributes = attributes.merge(class: classes, "aria-label": label)
        item_html = items.map do |item|
          id = item.fetch(:id).to_s
          item_classes = ["ag-tab-bar__item", id == active.to_s ? "is-active" : nil].compact.join(" ")
          icon_html = item[:icon] ? aurelglyph_icon(item[:icon], decorative: true, class: "ag-tab-bar__icon") : ""
          %(<a class="#{item_classes}" href="#{escape_html(item.fetch(:href, "#"))}"#{id == active.to_s ? ' aria-current="page"' : ""}>#{icon_html}<span class="ag-tab-bar__label">#{escape_html(item.fetch(:label))}</span></a>)
        end.join

        %(<nav #{html_attribute_string(html_attributes)}>#{item_html}</nav>)
      end

      def aurelglyph_search_field(name:, label:, value: nil, placeholder: "Search", **attributes)
        input_attributes = attributes.merge(
          class: ["ag-search__input", attributes.delete(:class)].compact.join(" "),
          name: name,
          placeholder: placeholder,
          type: "search",
          value: value
        ).compact

        <<~HTML.strip
          <div class="ag-search"><label class="ag-search__label" for="#{escape_html(name)}">#{escape_html(label)}</label><div class="ag-search__control">#{aurelglyph_icon("search", decorative: true, class: "ag-search__icon")}<input id="#{escape_html(name)}" #{html_attribute_string(input_attributes)}></div></div>
        HTML
      end

      def aurelglyph_switch(name:, label:, checked: false, description: nil, **attributes)
        input_attributes = attributes.merge(
          checked: checked ? "checked" : nil,
          class: "ag-switch__input",
          name: name,
          role: "switch",
          type: "checkbox"
        ).compact
        description_html = description ? %(<span class="ag-switch__description">#{escape_html(description)}</span>) : ""

        <<~HTML.strip
          <label class="ag-switch" for="#{escape_html(name)}"><span class="ag-switch__copy"><span class="ag-switch__label">#{escape_html(label)}</span>#{description_html}</span><input id="#{escape_html(name)}" #{html_attribute_string(input_attributes)}><span class="ag-switch__track" aria-hidden="true"><span class="ag-switch__thumb"></span></span></label>
        HTML
      end

      private

      def html_attribute_string(attributes)
        attributes.compact.map do |key, value|
          %(#{escape_html(key)}="#{escape_html(value)}")
        end.join(" ")
      end

      def escape_html(value)
        value.to_s
          .gsub("&", "&amp;")
          .gsub("<", "&lt;")
          .gsub(">", "&gt;")
          .gsub('"', "&quot;")
      end
    end
  end
end
