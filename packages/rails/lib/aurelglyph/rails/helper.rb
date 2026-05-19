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

      def aurelglyph_toolbar(label: "Toolbar", **attributes, &block)
        classes = ["ag-toolbar", attributes.delete(:class)].compact.join(" ")
        content = block ? block.call.to_s : ""

        %(<div #{html_attribute_string(attributes.merge(class: classes, role: "toolbar", "aria-label": label))}>#{content}</div>)
      end

      def aurelglyph_navigation_stack(title: nil, **attributes, &block)
        classes = ["ag-nav-stack", attributes.delete(:class)].compact.join(" ")
        title_html = title ? %(<h1 class="ag-nav-stack__title">#{escape_html(title)}</h1>) : ""
        content = block ? block.call.to_s : ""

        %(<main #{html_attribute_string(attributes.merge(class: classes))}>#{title_html}<div class="ag-nav-stack__pages">#{content}</div></main>)
      end

      def aurelglyph_navigation_page(title, actions: nil, **attributes, &block)
        classes = ["ag-nav-page", attributes.delete(:class)].compact.join(" ")
        content = block ? block.call.to_s : ""
        actions_html = actions ? %(<div class="ag-nav-page__actions">#{actions}</div>) : ""

        %(<section #{html_attribute_string(attributes.merge(class: classes))}><header class="ag-nav-page__header"><h2 class="ag-nav-page__title">#{escape_html(title)}</h2>#{actions_html}</header><div class="ag-nav-page__body">#{content}</div></section>)
      end

      def aurelglyph_sheet(title, open: false, actions: nil, **attributes, &block)
        classes = ["ag-sheet", attributes.delete(:class)].compact.join(" ")
        content = block ? block.call.to_s : ""
        actions_html = actions ? %(<div class="ag-sheet__actions">#{actions}</div>) : ""

        %(<dialog #{html_attribute_string(attributes.merge(class: classes, open: open ? "open" : nil, "aria-modal": "true"))}><div class="ag-sheet__surface"><header class="ag-sheet__header"><h2 class="ag-sheet__title">#{escape_html(title)}</h2>#{actions_html}</header><div class="ag-sheet__body">#{content}</div></div></dialog>)
      end

      def aurelglyph_segmented_control(items, active:, label: "Options", **attributes)
        classes = ["ag-segmented", attributes.delete(:class)].compact.join(" ")
        item_html = items.map do |item|
          id = item.fetch(:id).to_s
          item_classes = ["ag-segmented__item", id == active.to_s ? "is-active" : nil].compact.join(" ")
          %(<button class="#{item_classes}" type="button" role="radio" aria-checked="#{id == active.to_s}">#{escape_html(item.fetch(:label))}</button>)
        end.join

        %(<div #{html_attribute_string(attributes.merge(class: classes, role: "radiogroup", "aria-label": label))}>#{item_html}</div>)
      end

      def aurelglyph_select(name:, label:, options:, selected: nil, help_text: nil, **attributes)
        classes = ["ag-select__input", attributes.delete(:class)].compact.join(" ")
        option_html = options.map do |option|
          value = option.fetch(:value).to_s
          selected_attr = value == selected.to_s ? ' selected="selected"' : ""
          %(<option value="#{escape_html(value)}"#{selected_attr}>#{escape_html(option.fetch(:label))}</option>)
        end.join
        help_html = help_text ? %(<span class="ag-select__help" id="#{escape_html(name)}-help">#{escape_html(help_text)}</span>) : ""

        <<~HTML.strip
          <label class="ag-select"><span class="ag-select__label">#{escape_html(label)}</span><span class="ag-select__control"><select id="#{escape_html(name)}" name="#{escape_html(name)}" class="#{classes}"#{help_text ? %( aria-describedby="#{escape_html(name)}-help") : ""}>#{option_html}</select></span>#{help_html}</label>
        HTML
      end

      def aurelglyph_alert(title, tone: "info", **attributes, &block)
        classes = ["ag-alert", "ag-alert--#{tone}", attributes.delete(:class)].compact.join(" ")
        role = %w[danger warning].include?(tone.to_s) ? "alert" : "status"
        content = block ? %(<div class="ag-alert__body">#{block.call}</div>) : ""

        %(<div #{html_attribute_string(attributes.merge(class: classes, role: role))}><span class="ag-alert__dot" aria-hidden="true"></span><div class="ag-alert__content"><strong class="ag-alert__title">#{escape_html(title)}</strong>#{content}</div></div>)
      end

      def aurelglyph_empty_state(title, icon: "archive", **attributes, &block)
        classes = ["ag-empty-state", attributes.delete(:class)].compact.join(" ")
        content = block ? %(<div class="ag-empty-state__body">#{block.call}</div>) : ""

        %(<section #{html_attribute_string(attributes.merge(class: classes))}><span class="ag-empty-state__icon" aria-hidden="true">#{aurelglyph_icon(icon, decorative: true)}</span><h2 class="ag-empty-state__title">#{escape_html(title)}</h2>#{content}</section>)
      end

      def aurelglyph_avatar(name, initials: nil, src: nil, **attributes)
        classes = ["ag-avatar", attributes.delete(:class)].compact.join(" ")
        content = src ? %(<img alt="" class="ag-avatar__image" src="#{escape_html(src)}">) : %(<span class="ag-avatar__initials">#{escape_html(initials || name.split(/\s+/).first(2).map { |part| part[0]&.upcase }.join)}</span>)

        %(<span #{html_attribute_string(attributes.merge(class: classes, role: "img", "aria-label": name))}>#{content}</span>)
      end

      def aurelglyph_badge(label, tone: "neutral", **attributes)
        classes = ["ag-badge", "ag-badge--#{tone}", attributes.delete(:class)].compact.join(" ")

        %(<span #{html_attribute_string(attributes.merge(class: classes))}>#{escape_html(label)}</span>)
      end

      def aurelglyph_breadcrumbs(items, label: "Breadcrumb", **attributes)
        classes = ["ag-breadcrumbs", attributes.delete(:class)].compact.join(" ")
        item_html = items.map do |item|
          text = escape_html(item.fetch(:label))
          if item[:current]
            %(<li class="ag-breadcrumbs__item"><span class="ag-breadcrumbs__current" aria-current="page">#{text}</span></li>)
          else
            %(<li class="ag-breadcrumbs__item"><a class="ag-breadcrumbs__link" href="#{escape_html(item.fetch(:href, "#"))}">#{text}</a></li>)
          end
        end.join

        %(<nav #{html_attribute_string(attributes.merge(class: classes, "aria-label": label))}><ol class="ag-breadcrumbs__list">#{item_html}</ol></nav>)
      end

      def aurelglyph_tabs(items, active:, label: "Sections", **attributes, &block)
        classes = ["ag-tabs", attributes.delete(:class)].compact.join(" ")
        tab_html = items.map do |item|
          id = item.fetch(:id).to_s
          item_classes = ["ag-tabs__tab", id == active.to_s ? "is-active" : nil].compact.join(" ")
          %(<button class="#{item_classes}" id="#{escape_html(id)}-tab" type="button" role="tab" aria-selected="#{id == active.to_s}" aria-controls="#{escape_html(id)}-panel">#{escape_html(item.fetch(:label))}</button>)
        end.join
        panel = block ? %(<div class="ag-tabs__panel" id="#{escape_html(active)}-panel" role="tabpanel" aria-labelledby="#{escape_html(active)}-tab">#{block.call}</div>) : ""

        %(<div #{html_attribute_string(attributes.merge(class: classes))}><div class="ag-tabs__list" role="tablist" aria-label="#{escape_html(label)}">#{tab_html}</div>#{panel}</div>)
      end

      def aurelglyph_toast(title, tone: "info", **attributes, &block)
        classes = ["ag-toast", "ag-toast--#{tone}", attributes.delete(:class)].compact.join(" ")
        content = block ? %(<div class="ag-toast__body">#{block.call}</div>) : ""

        %(<div #{html_attribute_string(attributes.merge(class: classes, role: "status"))}><span class="ag-toast__dot" aria-hidden="true"></span><div class="ag-toast__content"><strong class="ag-toast__title">#{escape_html(title)}</strong>#{content}</div></div>)
      end

      def aurelglyph_progress(value:, max: 100, label: "Progress", **attributes)
        classes = ["ag-progress", attributes.delete(:class)].compact.join(" ")
        percent = [[(value.to_f / max.to_f) * 100, 0].max, 100].min

        %(<div #{html_attribute_string(attributes.merge(class: classes, role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": value))}><span class="ag-progress__bar" style="inline-size: #{percent}%"></span></div>)
      end

      def aurelglyph_skeleton(label: "Loading", **attributes)
        classes = ["ag-skeleton", attributes.delete(:class)].compact.join(" ")

        %(<span #{html_attribute_string(attributes.merge(class: classes, role: "status", "aria-label": label))}></span>)
      end

      def aurelglyph_metric(label:, value:, delta: nil, **attributes)
        classes = ["ag-metric", attributes.delete(:class)].compact.join(" ")
        delta_html = delta ? %(<span class="ag-metric__delta">#{escape_html(delta)}</span>) : ""

        %(<section #{html_attribute_string(attributes.merge(class: classes))}><p class="ag-metric__label">#{escape_html(label)}</p><strong class="ag-metric__value">#{escape_html(value)}</strong>#{delta_html}</section>)
      end

      def aurelglyph_data_table(columns:, rows:, **attributes)
        classes = ["ag-table-wrap", attributes.delete(:class)].compact.join(" ")
        headers = columns.map { |column| %(<th scope="col">#{escape_html(column.fetch(:header))}</th>) }.join
        body = rows.map do |row|
          cells = columns.map { |column| %(<td>#{escape_html(row.fetch(column.fetch(:key)))}</td>) }.join
          %(<tr>#{cells}</tr>)
        end.join

        %(<div #{html_attribute_string(attributes.merge(class: classes))}><table class="ag-table"><thead><tr>#{headers}</tr></thead><tbody>#{body}</tbody></table></div>)
      end

      def aurelglyph_pagination(current_page:, total_pages:, label: "Pagination", **attributes)
        classes = ["ag-pagination", attributes.delete(:class)].compact.join(" ")
        pages = (1..total_pages).map do |page|
          page_classes = ["ag-pagination__page", page == current_page ? "is-active" : nil].compact.join(" ")
          %(<button class="#{page_classes}" type="button"#{page == current_page ? ' aria-current="page"' : ""}>#{page}</button>)
        end.join

        %(<nav #{html_attribute_string(attributes.merge(class: classes, "aria-label": label))}><button class="ag-pagination__button" type="button">Previous</button><div class="ag-pagination__pages">#{pages}</div><button class="ag-pagination__button" type="button">Next</button></nav>)
      end

      def aurelglyph_command_palette(items, label: "Command palette", placeholder: "Type a command", **attributes)
        classes = ["ag-command-palette", attributes.delete(:class)].compact.join(" ")
        item_html = items.map do |item|
          icon = item[:icon] ? aurelglyph_icon(item[:icon], decorative: true, class: "ag-command-palette__icon") : ""
          shortcut = item[:shortcut] ? %(<kbd class="ag-command-palette__shortcut">#{escape_html(item[:shortcut])}</kbd>) : ""
          %(<button class="ag-command-palette__item" type="button" role="option">#{icon}<span class="ag-command-palette__item-label">#{escape_html(item.fetch(:label))}</span>#{shortcut}</button>)
        end.join

        %(<div #{html_attribute_string(attributes.merge(class: classes, role: "dialog", "aria-label": label))}><label class="ag-command-palette__search"><span class="ag-command-palette__label">#{escape_html(label)}</span><input class="ag-command-palette__input" placeholder="#{escape_html(placeholder)}" type="search"></label><div class="ag-command-palette__list" role="listbox">#{item_html}</div></div>)
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
