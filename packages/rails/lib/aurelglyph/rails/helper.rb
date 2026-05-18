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
        attribute_string = html_attributes.map do |key, value|
          %(#{escape_html(key)}="#{escape_html(value)}")
        end.join(" ")
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

      private

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
