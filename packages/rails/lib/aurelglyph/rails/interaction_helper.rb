# frozen_string_literal: true

module Aurelglyph
  module Rails
    module InteractionHelper
      LAYOUT_TAGS = %w[article aside div footer header li main nav ol section span ul].freeze
      DRAWER_SIDES = %w[start end top bottom].freeze
      OVERLAY_VARIANTS = %w[default compact wide].freeze
      MENU_PLACEMENTS = %w[bottom-start bottom-end top-start top-end].freeze
      TOOLTIP_PLACEMENTS = %w[top right bottom left].freeze
      BUTTON_VARIANTS = %w[primary secondary danger ghost].freeze
      BUTTON_TYPES = %w[button submit reset].freeze
      CONTROL_SIZES = %w[sm md lg].freeze
      SURFACE_ELEVATIONS = %w[flat raised floating].freeze
      SURFACE_PADDING = %w[none sm md lg].freeze
      STACK_DIRECTIONS = %w[row column].freeze
      STACK_ALIGNMENTS = %w[start center end stretch baseline].freeze
      STACK_JUSTIFICATIONS = %w[start center end between around evenly].freeze
      CONTAINER_SIZES = %w[sm md lg xl full].freeze
      GRID_BREAKPOINTS = %w[base sm md lg xl].freeze
      SPACE_STEPS = %w[0 1 2 3 4 5 6 8 10 12 16].freeze

      def aurelglyph_dialog(title, open: false, actions: nil, variant: "default", dismissible: true,
                            close_label: "Close", **attributes, &block)
        render_aurelglyph_overlay(
          "dialog",
          title,
          open: open,
          actions: actions,
          variant: validate_enum!(variant, OVERLAY_VARIANTS, :variant),
          dismissible: dismissible,
          close_label: close_label,
          attributes: attributes,
          &block
        )
      end

      def aurelglyph_drawer(title, open: false, actions: nil, side: "end", dismissible: true,
                            close_label: "Close", **attributes, &block)
        render_aurelglyph_overlay(
          "drawer",
          title,
          open: open,
          actions: actions,
          side: validate_enum!(side, DRAWER_SIDES, :side),
          dismissible: dismissible,
          close_label: close_label,
          attributes: attributes,
          &block
        )
      end

      def aurelglyph_menu(label:, items:, open: false, trigger: nil, placement: "bottom-start",
                          disabled: false, trigger_attributes: {}, **attributes)
        placement = validate_enum!(placement, MENU_PLACEMENTS, :placement)
        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-menu")
        trigger_id = "#{root_id}-trigger"
        menu_id = "#{root_id}-content"
        trigger_html_attributes = trigger_attributes.dup
        supplied_trigger_disabled = extract_html_attribute!(trigger_html_attributes, :disabled)
        trigger_disabled = disabled || supplied_trigger_disabled
        trigger_html_attributes = without_html_attributes(trigger_html_attributes, :id, :role, :type)
        effective_open = open && !trigger_disabled
        classes = class_names_for("ag-menu", effective_open && "is-open", extract_html_attribute!(html_attributes, :class))
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_menu: "",
          open: effective_open.to_s,
          placement: placement,
          disabled: trigger_disabled ? "true" : nil
        )

        trigger_classes = class_names_for("ag-menu__trigger", extract_html_attribute!(trigger_html_attributes, :class))
        trigger_html_attributes = component_data_attributes(trigger_html_attributes, aurelglyph_menu_trigger: "")
        trigger_html_attributes = component_aria_attributes(
          trigger_html_attributes,
          controls: menu_id,
          expanded: effective_open.to_s,
          haspopup: "menu"
        )
        chevron = aurelglyph_icon("chevron-down", decorative: true, class: "ag-menu__chevron")
        trigger_html = content_tag(
          :button,
          safe_join([trigger || label, chevron]),
          trigger_html_attributes.merge(
            id: trigger_id,
            class: trigger_classes,
            type: "button",
            disabled: trigger_disabled ? true : nil
          )
        )
        items_html = items.each_with_index.map { |item, index| render_aurelglyph_menu_item(item, index) }
        menu_html = content_tag(
          :div,
          safe_join(items_html),
          id: menu_id,
          class: "ag-menu__surface ag-menu__content",
          role: "menu",
          hidden: effective_open ? nil : true,
          "aria-labelledby": trigger_id,
          "data-aurelglyph-menu-content": ""
        )

        content_tag(:div, safe_join([trigger_html, menu_html]), html_attributes.merge(id: root_id, class: classes))
      end

      def aurelglyph_dropdown(**arguments)
        arguments = arguments.dup
        arguments[:class] = class_names_for("ag-dropdown", extract_html_attribute!(arguments, :class))
        aurelglyph_menu(**arguments)
      end

      def aurelglyph_popover(trigger:, label:, open: false, placement: "bottom",
                             disabled: false, trigger_attributes: {}, **attributes, &block)
        placement = validate_enum!(placement, TOOLTIP_PLACEMENTS, :placement)
        html_attributes = attributes.dup
        classes = class_names_for("ag-popover", open && "is-open", extract_html_attribute!(html_attributes, :class))
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-popover")
        trigger_id = "#{root_id}-trigger"
        content_id = "#{root_id}-content"
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_popover: "",
          open: open.to_s,
          placement: placement,
          disabled: disabled ? "true" : nil
        )

        trigger_html_attributes = trigger_attributes.dup
        supplied_trigger_disabled = extract_html_attribute!(trigger_html_attributes, :disabled)
        trigger_disabled = disabled || supplied_trigger_disabled
        trigger_html_attributes = without_html_attributes(trigger_html_attributes, :id, :role, :type)
        trigger_classes = class_names_for("ag-popover__trigger", extract_html_attribute!(trigger_html_attributes, :class))
        trigger_html_attributes = component_data_attributes(trigger_html_attributes, aurelglyph_popover_trigger: "")
        trigger_html_attributes = component_aria_attributes(
          trigger_html_attributes,
          controls: content_id,
          expanded: open.to_s,
          haspopup: "dialog"
        )
        trigger_html = content_tag(
          :button,
          trigger,
          trigger_html_attributes.merge(
            id: trigger_id,
            class: trigger_classes,
            type: "button",
            disabled: trigger_disabled ? true : nil
          )
        )
        panel = content_tag(
          :div,
          capture_content(&block),
          id: content_id,
          class: "ag-popover__surface ag-popover__content",
          role: "dialog",
          tabindex: -1,
          hidden: open ? nil : true,
          "aria-label": label,
          "data-aurelglyph-popover-content": ""
        )

        content_tag(:div, safe_join([trigger_html, panel]), html_attributes.merge(id: root_id, class: classes))
      end

      def aurelglyph_tooltip(content, trigger: nil, label: nil, href: nil, placement: "top",
                            trigger_attributes: {}, **attributes, &block)
        placement = validate_enum!(placement, TOOLTIP_PLACEMENTS, :placement)
        html_attributes = attributes.dup
        classes = class_names_for("ag-tooltip", extract_html_attribute!(html_attributes, :class))
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-tooltip")
        tooltip_id = "#{root_id}-content"
        trigger_content = block ? capture_content(&block) : trigger || label
        raise ArgumentError, "trigger, label, or a block is required" if trigger_content.nil?

        target_attributes = trigger_attributes.dup
        target_attributes = without_html_attributes(target_attributes, :href)
        target_classes = class_names_for(
          "ag-button",
          "ag-button--secondary",
          "ag-tooltip__trigger",
          extract_html_attribute!(target_attributes, :class)
        )
        described_by = merge_idrefs(extract_aria_attribute!(target_attributes, :describedby), tooltip_id)
        target_attributes = component_aria_attributes(target_attributes, describedby: described_by)
        if href
          target = content_tag(
            :a,
            trigger_content,
            target_attributes.merge(class: target_classes, href: href)
          )
        else
          target = content_tag(
            :button,
            trigger_content,
            target_attributes.merge(
              class: target_classes,
              type: extract_html_attribute!(target_attributes, :type) || "button"
            )
          )
        end
        tooltip = content_tag(
          :span,
          content,
          class: "ag-tooltip__surface ag-tooltip__content",
          id: tooltip_id,
          role: "tooltip",
          hidden: true,
          "data-aurelglyph-tooltip-content": ""
        )
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_tooltip: "",
          open: "false",
          placement: placement
        )

        content_tag(:span, safe_join([target, tooltip]), html_attributes.merge(id: root_id, class: classes))
      end

      def aurelglyph_icon_button(icon:, label:, href: nil, variant: "secondary", type: "button", disabled: false,
                                 loading: false, busy: false, **attributes)
        variant = validate_enum!(variant, BUTTON_VARIANTS, :variant)
        type = validate_enum!(type, BUTTON_TYPES, :type)
        html_attributes = attributes.dup
        html_attributes = without_html_attributes(html_attributes, :disabled, :href, :tabindex, :type)
        classes = class_names_for(
          "ag-button",
          "ag-button--#{variant}",
          "ag-icon-button",
          loading && "is-loading",
          extract_html_attribute!(html_attributes, :class)
        )
        unavailable = disabled || loading
        content = safe_join([
          aurelglyph_icon(icon, decorative: true, class: "ag-button__icon"),
          loading ? content_tag(:span, nil, class: "ag-button__spinner", "aria-hidden": "true") : nil
        ].compact)
        html_attributes = component_data_attributes(
          html_attributes,
          busy: busy ? "true" : nil,
          disabled: unavailable ? "true" : nil,
          loading: loading ? "true" : nil
        )
        html_attributes = component_aria_attributes(
          html_attributes,
          label: label,
          busy: (busy || loading) ? "true" : nil,
          disabled: href && unavailable ? "true" : nil
        )
        common = html_attributes.merge(
          class: classes
        ).compact

        if href
          content_tag(
            :a,
            content,
            common.merge(href: unavailable ? nil : href, tabindex: unavailable ? -1 : nil).compact
          )
        else
          content_tag(
            :button,
            content,
            common.merge(type: type, disabled: unavailable ? true : nil).compact
          )
        end
      end

      def aurelglyph_button_group(label:, orientation: "horizontal", **attributes, &block)
        orientation = validate_enum!(orientation, %w[horizontal vertical], :orientation)
        html_attributes = attributes.dup
        classes = class_names_for("ag-button-group", extract_html_attribute!(html_attributes, :class))
        html_attributes = without_html_attributes(html_attributes, :role)
        html_attributes = component_aria_attributes(html_attributes, label: label, orientation: nil)
        html_attributes = component_data_attributes(html_attributes, orientation: orientation)

        content_tag(
          :div,
          capture_content(&block),
          html_attributes.merge(
            class: classes,
            role: "group"
          )
        )
      end

      def aurelglyph_checkbox(name:, label:, value: "1", checked: false, indeterminate: false,
                              description: nil, error: nil,
                              disabled: false, read_only: false, loading: false, busy: false,
                              required: false, invalid: false, **attributes)
        input_attributes = attributes.dup
        input_classes = class_names_for("ag-checkbox__input", extract_html_attribute!(input_attributes, :class))
        input_id = extract_html_attribute!(input_attributes, :id) || unique_dom_id("ag-checkbox")
        input_attributes = without_html_attributes(
          input_attributes,
          :disabled,
          :checked,
          :name,
          :readonly,
          :required,
          :type,
          :value
        )
        description_id = description && "#{input_id}-description"
        error_id = error && "#{input_id}-error"
        described_by = merge_idrefs(
          extract_aria_attribute!(input_attributes, :describedby),
          description_id,
          error_id
        )
        unavailable = disabled || loading
        interaction_disabled = unavailable || read_only
        invalid_state = invalid || !error.nil?
        input_attributes = component_aria_attributes(
          input_attributes,
          describedby: described_by,
          invalid: invalid_state ? "true" : nil,
          busy: (busy || loading) ? "true" : nil,
          checked: indeterminate ? "mixed" : (checked ? "true" : "false"),
          readonly: read_only ? "true" : nil
        )
        input_attributes = component_data_attributes(
          input_attributes,
          aurelglyph_checkbox_input: "",
          indeterminate: indeterminate ? "true" : nil
        )
        input = tag.input(
          **input_attributes.merge(
            id: input_id,
            class: input_classes,
            name: read_only ? nil : name,
            type: "checkbox",
            value: value,
            checked: checked ? true : nil,
            disabled: interaction_disabled ? true : nil,
            required: required ? true : nil
          ).compact
        )
        read_only_value = read_only && checked && !unavailable ? tag.input(type: "hidden", name: name, value: value) : nil
        copy = content_tag(
          :span,
          safe_join([
            content_tag(:span, label, class: "ag-checkbox__label"),
            description && content_tag(:span, description, class: "ag-checkbox__description", id: description_id)
          ].compact),
          class: "ag-checkbox__copy"
        )
        error_html = error && content_tag(:span, error, class: "ag-checkbox__error", id: error_id, "aria-live": "polite")
        root_classes = class_names_for("ag-checkbox", unavailable && "is-disabled", invalid_state && "is-invalid")

        content_tag(
          :span,
          safe_join([
            content_tag(
              :label,
              safe_join([input, content_tag(:span, nil, class: "ag-checkbox__box", "aria-hidden": "true"), copy]),
              for: input_id,
              class: "ag-checkbox__control"
            ),
            read_only_value,
            error_html
          ].compact),
          class: class_names_for(root_classes, read_only && "is-readonly"),
          "data-disabled": unavailable ? "true" : nil,
          "data-busy": busy ? "true" : nil,
          "data-invalid": invalid_state ? "true" : nil,
          "data-loading": loading ? "true" : nil,
          "data-readonly": read_only ? "true" : nil
        )
      end

      def aurelglyph_radio_group(name:, label:, options:, value: nil, description: nil, help_text: nil,
                                 error: nil, orientation: "vertical", disabled: false,
                                 read_only: false, loading: false, busy: false, required: false,
                                 invalid: false, **attributes)
        orientation = validate_enum!(orientation, %w[horizontal vertical], :orientation)
        help_text ||= description
        html_attributes = attributes.dup
        classes = class_names_for("ag-radio-group", extract_html_attribute!(html_attributes, :class))
        group_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-radio-group")
        html_attributes = without_html_attributes(html_attributes, :disabled)
        description_id = help_text && "#{group_id}-help"
        error_id = error && "#{group_id}-error"
        invalid_state = invalid || !error.nil?
        unavailable = disabled || loading
        normalized_value = value.to_s unless value.nil?
        selected_value = options.find do |option|
          !option[:disabled] && option.fetch(:value).to_s == normalized_value
        end&.fetch(:value)&.to_s unless normalized_value.nil?
        options_html = options.each_with_index.map do |option, index|
          option_value = option.fetch(:value).to_s
          option_id = "#{group_id}-option-#{index}"
          option_disabled = unavailable || read_only || option[:disabled]
          option_description_id = option[:description] && "#{option_id}-description"
          input = tag.input(
            id: option_id,
            class: "ag-radio__input",
            name: read_only ? nil : name,
            type: "radio",
            value: option_value,
            checked: option_value == selected_value ? true : nil,
            disabled: option_disabled ? true : nil,
            required: required ? true : nil,
            "aria-invalid": invalid_state ? "true" : nil,
            "aria-busy": (busy || loading) ? "true" : nil,
            "aria-describedby": option_description_id
          )
          content_tag(
            :label,
            safe_join([
              input,
              content_tag(:span, nil, class: "ag-radio__circle", "aria-hidden": "true"),
              content_tag(
                :span,
                safe_join([
                  content_tag(:span, option.fetch(:label), class: "ag-radio__label"),
                  option[:description] && content_tag(:span, option[:description], class: "ag-radio__description", id: option_description_id)
                ].compact),
                class: "ag-radio__copy"
              )
            ]),
            class: class_names_for("ag-radio", option_disabled && "is-disabled"),
            for: option_id
          )
        end
        description_html = help_text && content_tag(:span, help_text, class: "ag-radio-group__help", id: description_id)
        error_html = error && content_tag(:span, error, class: "ag-radio-group__error", id: error_id, "aria-live": "polite")
        read_only_value = if read_only && !unavailable && !selected_value.nil?
                            tag.input(type: "hidden", name: name, value: selected_value)
                          end
        html_attributes = component_data_attributes(
          html_attributes,
          busy: busy ? "true" : nil,
          disabled: unavailable ? "true" : nil,
          invalid: invalid_state ? "true" : nil,
          loading: loading ? "true" : nil,
          orientation: orientation,
          readonly: read_only ? "true" : nil
        )
        html_attributes = component_aria_attributes(
          html_attributes,
          describedby: merge_idrefs(description_id, error_id),
          invalid: invalid_state ? "true" : nil,
          busy: (busy || loading) ? "true" : nil,
          readonly: nil
        )

        content_tag(
          :fieldset,
          safe_join([
            content_tag(:legend, label, class: "ag-radio-group__legend"),
            description_html,
            content_tag(:div, safe_join(options_html), class: "ag-radio-group__options"),
            read_only_value,
            error_html
          ].compact),
          html_attributes.merge(
            id: group_id,
            class: classes,
            disabled: unavailable ? true : nil
          ).compact
        )
      end

      def aurelglyph_slider(name:, label:, value:, min: 0, max: 100, step: 1, help_text: nil,
                            error: nil, disabled: false, read_only: false, loading: false,
                            busy: false, required: false, invalid: false, **attributes)
        render_aurelglyph_input_field(
          "slider",
          name: name,
          label: label,
          value: value,
          help_text: help_text,
          error: error,
          disabled: disabled,
          read_only: read_only,
          loading: loading,
          busy: busy,
          required: required,
          invalid: invalid,
          attributes: attributes,
          input_type: "range",
          native_attributes: { min: min, max: max, step: step }
        )
      end

      def aurelglyph_number_field(name:, label:, value: nil, min: nil, max: nil, step: 1,
                                  placeholder: nil, help_text: nil, error: nil, disabled: false,
                                  read_only: false, loading: false, busy: false, required: false,
                                  invalid: false, decrement_label: "Decrease value",
                                  increment_label: "Increase value", **attributes)
        render_aurelglyph_input_field(
          "number-field",
          name: name,
          label: label,
          value: value,
          help_text: help_text,
          error: error,
          disabled: disabled,
          read_only: read_only,
          loading: loading,
          busy: busy,
          required: required,
          invalid: invalid,
          attributes: attributes,
          input_type: "number",
          native_attributes: { min: min, max: max, step: step, placeholder: placeholder },
          decrement_label: decrement_label,
          increment_label: increment_label
        )
      end

      def aurelglyph_combobox(name:, label:, options:, value: nil, input_value: nil,
                              placeholder: nil, help_text: nil, error: nil,
                              no_results_text: "No results", open: false, disabled: false,
                              read_only: false, loading: false, busy: false, required: false,
                              invalid: false, input_attributes: {}, **attributes)
        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-combobox")
        input_id = "#{root_id}-input"
        list_id = "#{root_id}-listbox"
        help_id = help_text && "#{root_id}-help"
        error_id = error && "#{root_id}-error"
        invalid_state = invalid || !error.nil?
        unavailable = disabled || loading
        effective_open = open && !unavailable && !read_only
        classes = class_names_for("ag-combobox", effective_open && "is-open", extract_html_attribute!(html_attributes, :class))
        selected_option = options.find do |option|
          !option[:disabled] && !value.nil? && option.fetch(:value).to_s == value.to_s
        end
        selected_value = selected_option&.fetch(:value)&.to_s
        visible_value = input_value.nil? ? selected_option&.fetch(:label, nil) : input_value
        visible_value ||= ""
        input_html_attributes = input_attributes.dup
        input_classes = class_names_for("ag-combobox__input", extract_html_attribute!(input_html_attributes, :class))
        extract_html_attribute!(input_html_attributes, :id)
        input_html_attributes = without_html_attributes(
          input_html_attributes,
          :autocomplete,
          :disabled,
          :name,
          :placeholder,
          :readonly,
          :required,
          :role,
          :type,
          :value
        )
        described_by = merge_idrefs(extract_aria_attribute!(input_html_attributes, :describedby), help_id, error_id)
        input_html_attributes = component_aria_attributes(
          input_html_attributes,
          autocomplete: "list",
          controls: list_id,
          expanded: effective_open.to_s,
          describedby: described_by,
          activedescendant: nil,
          invalid: invalid_state ? "true" : nil,
          required: required ? "true" : nil,
          readonly: read_only ? "true" : nil,
          busy: (busy || loading) ? "true" : nil
        )
        input_html_attributes = component_data_attributes(input_html_attributes, aurelglyph_combobox_input: "")
        input = tag.input(
          **input_html_attributes.merge(
            id: input_id,
            class: input_classes,
            type: "text",
            value: visible_value,
            placeholder: placeholder,
            autocomplete: "off",
            disabled: unavailable ? true : nil,
            readonly: read_only ? true : nil,
            required: required ? true : nil,
            role: "combobox"
          ).compact
        )
        submitted_value = tag.input(
          type: "hidden",
          name: name,
          value: selected_value,
          disabled: unavailable ? true : nil,
          "data-aurelglyph-combobox-value": ""
        )
        options_html = options.each_with_index.map do |option, index|
          option_value = option.fetch(:value).to_s
          selected = option_value == selected_value
          content_tag(
            :div,
            option.fetch(:label),
            id: "#{root_id}-option-#{index}",
            class: class_names_for("ag-combobox__option", selected && "is-selected", option[:disabled] && "is-disabled"),
            role: "option",
            tabindex: -1,
            "aria-selected": selected.to_s,
            "aria-disabled": option[:disabled] ? "true" : nil,
            "data-aurelglyph-combobox-option": "",
            "data-value": option_value,
            "data-label": option.fetch(:label),
            "data-keywords": Array(option[:keywords]).join(" ")
          )
        end
        no_results = content_tag(
          :div,
          no_results_text,
          class: "ag-combobox__empty",
          hidden: true,
          role: "option",
          "aria-disabled": "true",
          "aria-selected": "false",
          "aria-live": "polite",
          "data-aurelglyph-combobox-empty": ""
        )
        list = content_tag(
          :div,
          safe_join([safe_join(options_html), no_results]),
          id: list_id,
          class: "ag-combobox__list ag-combobox__listbox",
          role: "listbox",
          "aria-label": label,
          hidden: effective_open ? nil : true,
          "data-aurelglyph-combobox-listbox": ""
        )
        toggle = content_tag(
          :button,
          aurelglyph_icon("chevron-down", decorative: true),
          class: "ag-combobox__toggle",
          type: "button",
          tabindex: -1,
          disabled: (unavailable || read_only) ? true : nil,
          "aria-label": effective_open ? "Close options" : "Open options",
          "data-aurelglyph-combobox-toggle": ""
        )
        help = help_text && content_tag(:span, help_text, class: "ag-combobox__help", id: help_id)
        error_html = error && content_tag(:span, error, class: "ag-combobox__error", id: error_id, "aria-live": "polite")
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_combobox: "",
          open: effective_open.to_s,
          disabled: unavailable ? "true" : nil,
          invalid: invalid_state ? "true" : nil,
          loading: loading ? "true" : nil,
          busy: busy ? "true" : nil,
          readonly: read_only ? "true" : nil
        )

        content_tag(
          :div,
          safe_join([
            content_tag(:label, label, class: "ag-combobox__label", for: input_id),
            content_tag(:div, safe_join([input, toggle]), class: "ag-combobox__control"),
            list,
            submitted_value,
            help,
            error_html
          ].compact),
          html_attributes.merge(id: root_id, class: classes)
        )
      end

      def aurelglyph_autocomplete(**arguments)
        aurelglyph_combobox(**arguments)
      end

      def aurelglyph_spinner(label: "Loading", size: "md", **attributes)
        size = validate_enum!(size, CONTROL_SIZES, :size)
        html_attributes = attributes.dup
        classes = class_names_for("ag-spinner", "ag-spinner--#{size}", extract_html_attribute!(html_attributes, :class))
        html_attributes = without_html_attributes(html_attributes, :role)
        html_attributes = component_aria_attributes(html_attributes, label: label)
        html_attributes = component_data_attributes(html_attributes, size: size)

        content_tag(
          :span,
          safe_join([
            content_tag(:span, nil, class: "ag-spinner__ring ag-spinner__indicator", "aria-hidden": "true")
          ]),
          html_attributes.merge(class: classes, role: "status")
        )
      end

      def aurelglyph_divider(label: nil, orientation: "horizontal", **attributes)
        orientation = validate_enum!(orientation, %w[horizontal vertical], :orientation)
        html_attributes = attributes.dup
        classes = class_names_for("ag-divider", extract_html_attribute!(html_attributes, :class))
        html_attributes = without_html_attributes(html_attributes, :role)
        html_attributes = component_aria_attributes(
          html_attributes,
          label: label,
          orientation: orientation == "vertical" ? orientation : nil
        )
        html_attributes = component_data_attributes(html_attributes, orientation: orientation)
        divider_content = orientation == "horizontal" && label ? content_tag(:span, label, class: "ag-divider__label") : nil
        content_tag(
          :div,
          divider_content,
          html_attributes.merge(
            class: classes,
            role: "separator"
          ).compact
        )
      end

      def aurelglyph_surface(as: :div, elevation: "raised", padding: "md", **attributes, &block)
        elevation = validate_enum!(elevation, SURFACE_ELEVATIONS, :elevation)
        padding = validate_enum!(padding, SURFACE_PADDING, :padding)
        render_layout_element(
          "surface",
          as: as,
          attributes: attributes,
          data: { elevation: elevation, padding: padding },
          &block
        )
      end

      def aurelglyph_box(as: :div, elevation: "flat", padding: "md", **attributes, &block)
        attributes = attributes.dup
        attributes[:class] = class_names_for("ag-box", extract_html_attribute!(attributes, :class))
        aurelglyph_surface(as: as, elevation: elevation, padding: padding, **attributes, &block)
      end

      def aurelglyph_stack(as: :div, direction: "column", gap: "md", align: "stretch",
                           justify: "start", wrap: false, **attributes, &block)
        direction = validate_enum!(direction, STACK_DIRECTIONS, :direction)
        align = validate_enum!(align, STACK_ALIGNMENTS, :align) if align
        justify = validate_enum!(justify, STACK_JUSTIFICATIONS, :justify) if justify
        html_attributes = attributes.dup
        html_attributes[:style] = merge_component_style(
          extract_html_attribute!(html_attributes, :style),
          "--ag-stack-gap" => spacing_css_value(gap)
        )
        render_layout_element(
          "stack",
          as: as,
          attributes: html_attributes,
          data: { direction: direction, gap: gap, align: align, justify: justify, wrap: wrap.to_s },
          &block
        )
      end

      def aurelglyph_container(as: :div, size: "lg", **attributes, &block)
        size = validate_enum!(size, CONTAINER_SIZES, :size)
        render_layout_element("container", as: as, attributes: attributes, data: { size: size }, &block)
      end

      def aurelglyph_grid(as: :div, columns: 12, gap: "4", min_item_width: nil,
                          **attributes, &block)
        html_attributes = attributes.dup
        styles = { "--ag-grid-gap" => spacing_css_value(gap) }
        if columns.is_a?(Hash)
          styles["--ag-grid-columns"] = "12"
          styles["--ag-grid-target-width"] = grid_target_width("12")
          columns.each do |breakpoint, count|
            breakpoint_name = validate_enum!(breakpoint, GRID_BREAKPOINTS, :breakpoint)
            property = breakpoint_name == "base" ? "--ag-grid-columns" : "--ag-grid-columns-#{breakpoint_name}"
            column_value = grid_column_value(count)
            styles[property] = column_value
            target_property = breakpoint_name == "base" ? "--ag-grid-target-width" : "--ag-grid-target-width-#{breakpoint_name}"
            styles[target_property] = grid_target_width(column_value)
          end
        elsif columns
          column_value = grid_column_value(columns)
          styles["--ag-grid-columns"] = column_value
          styles["--ag-grid-target-width"] = grid_target_width(column_value)
        end
        styles["--ag-grid-min-item-width"] = css_dimension!(min_item_width, :min_item_width) if min_item_width
        html_attributes[:style] = merge_component_style(extract_html_attribute!(html_attributes, :style), styles)

        render_layout_element("grid", as: as, attributes: html_attributes, &block)
      end

      private

      def render_aurelglyph_overlay(kind, title, open:, actions:, dismissible:, close_label:, attributes:,
                                    variant: nil, side: nil, &block)
        html_attributes = attributes.dup
        classes = class_names_for(
          "ag-sheet",
          "ag-#{kind}",
          side && "ag-drawer--#{side}",
          open && "is-open",
          extract_html_attribute!(html_attributes, :class)
        )
        overlay_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-#{kind}")
        title_id = unique_dom_id("ag-#{kind}-title")
        labelled_by = extract_aria_attribute!(html_attributes, :labelledby) || title_id
        extract_aria_attribute!(html_attributes, :modal)
        %i[aria-modal data-aurelglyph-sheet data-aurelglyph-overlay data-open open tabindex].each do |attribute|
          extract_html_attribute!(html_attributes, attribute)
        end
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_sheet: "",
          aurelglyph_overlay: kind,
          "aurelglyph_#{kind}" => "",
          dismissible: dismissible.to_s,
          open: open.to_s,
          side: side,
          variant: variant
        )
        actions_html = actions && content_tag(:div, actions, class: "ag-sheet__actions ag-#{kind}__actions")
        dismiss = if dismissible
          content_tag(
            :button,
            safe_join([
              aurelglyph_icon("close", decorative: true)
            ]),
            class: "ag-button ag-button--ghost ag-icon-button ag-sheet__dismiss ag-#{kind}__dismiss",
            type: "button",
            "aria-label": close_label,
            "data-aurelglyph-sheet-dismiss": "",
            "data-aurelglyph-#{kind}-dismiss": ""
          )
        end
        header = content_tag(
          :header,
          safe_join([
            content_tag(:h2, title, class: "ag-sheet__title ag-#{kind}__title", id: title_id),
            actions_html,
            dismiss
          ].compact),
          class: "ag-sheet__header ag-#{kind}__header"
        )
        body = content_tag(:div, capture_content(&block), class: "ag-sheet__body ag-#{kind}__body")
        surface = content_tag(:div, safe_join([header, body]), class: "ag-sheet__surface ag-#{kind}__surface")

        content_tag(
          :dialog,
          surface,
          html_attributes.merge(
            id: overlay_id,
            class: classes,
            tabindex: -1,
            "aria-labelledby": labelled_by
          )
        )
      end

      def render_aurelglyph_menu_item(item, index)
        if item[:separator]
          return content_tag(
            :div,
            nil,
            class: "ag-menu__separator ag-divider",
            role: "separator",
            "data-orientation": "horizontal"
          )
        end

        item_attributes = (item[:attributes] || {}).dup
        supplied_item_type = extract_html_attribute!(item_attributes, :type)
        item_class = class_names_for("ag-menu__item", item[:class], extract_html_attribute!(item_attributes, :class))
        item_attributes = without_html_attributes(
          item_attributes,
          :disabled,
          :href,
          :name,
          :role,
          :tabindex,
          :value
        )
        role = validate_enum!(item.fetch(:role, "menuitem"), %w[menuitem menuitemcheckbox menuitemradio], :role)
        disabled = item[:disabled]
        checked = menu_item_checked_state(role, item[:checked])
        icon = item[:icon] && aurelglyph_icon(item[:icon], decorative: true, class: "ag-menu__icon")
        shortcut = item[:shortcut] && content_tag(:kbd, item[:shortcut], class: "ag-menu__shortcut")
        content = safe_join([
          icon,
          content_tag(:span, item.fetch(:label), class: "ag-menu__label"),
          shortcut
        ].compact)
        item_attributes = component_data_attributes(
          item_attributes,
          aurelglyph_menu_item: "",
          value: item.fetch(:value, index).to_s
        )
        item_attributes = component_aria_attributes(
          item_attributes,
          disabled: disabled ? "true" : nil,
          checked: checked
        )
        common = item_attributes.merge(
          class: item_class,
          role: role,
          tabindex: -1
        ).compact

        if item[:href]
          content_tag(:a, content, common.merge(href: disabled ? nil : item[:href]))
        else
          content_tag(
            :button,
            content,
            common.merge(
              type: supplied_item_type || (item[:name] ? "submit" : "button"),
              name: item[:name],
              value: item[:form_value],
              disabled: disabled ? true : nil
            ).compact
          )
        end
      end

      def render_aurelglyph_input_field(component, name:, label:, value:, help_text:, error:, disabled:,
                                         read_only:, loading:, busy:, required:, invalid:, attributes:,
                                         input_type:, native_attributes:, decrement_label: nil,
                                         increment_label: nil)
        input_attributes = attributes.dup
        input_classes = class_names_for("ag-#{component}__input", extract_html_attribute!(input_attributes, :class))
        input_id = extract_html_attribute!(input_attributes, :id) || unique_dom_id("ag-#{component}")
        input_attributes = without_html_attributes(
          input_attributes,
          :disabled,
          :name,
          :readonly,
          :required,
          :type,
          :value,
          *native_attributes.keys
        )
        help_id = help_text && "#{input_id}-help"
        error_id = error && "#{input_id}-error"
        described_by = merge_idrefs(extract_aria_attribute!(input_attributes, :describedby), help_id, error_id)
        invalid_state = invalid || !error.nil?
        unavailable = disabled || loading
        native_read_only = input_type != "range" && read_only
        read_only_range = input_type == "range" && read_only
        submitted_name = read_only_range ? nil : name
        effective_value = value
        minimum = nil
        maximum = nil
        number_step = nil
        if input_type == "range"
          minimum = finite_number!(native_attributes.fetch(:min, 0), :min)
          maximum = finite_number!(native_attributes.fetch(:max, 100), :max)
          step = finite_number!(native_attributes.fetch(:step, 1), :step)
          raise ArgumentError, "max must be greater than min" unless maximum > minimum
          raise ArgumentError, "step must be greater than zero" unless step.positive?

          current = finite_number!(value, :value)
          current = [[current, minimum].max, maximum].min
          lower = minimum + (((current - minimum) / step).floor * step)
          upper_candidate = lower + step
          upper = upper_candidate <= maximum ? upper_candidate : lower
          current = current - lower < upper - current ? lower : upper
          current = current.round(12)
          effective_value = serialize_number(current)
          progress = ((current - minimum) / (maximum - minimum)) * 100
          native_attributes = native_attributes.merge(
            min: serialize_number(minimum),
            max: serialize_number(maximum),
            step: serialize_number(step)
          )
          input_attributes[:style] = merge_component_style(
            extract_html_attribute!(input_attributes, :style),
            "--ag-slider-progress" => "#{progress}%"
          )
        elsif input_type == "number"
          minimum = coerce_finite_number(native_attributes[:min])
          maximum = coerce_finite_number(native_attributes[:max])
          maximum = minimum if minimum && maximum && maximum < minimum
          current = value.nil? || value == "" ? nil : coerce_finite_number(value)
          if current
            current = [current, minimum].max if minimum
            current = [current, maximum].min if maximum
          end
          effective_value = current && serialize_number(current)
          parsed_step = native_attributes[:step] == "any" ? 1 : coerce_finite_number(native_attributes[:step])
          number_step = parsed_step && !parsed_step.zero? ? parsed_step.abs : 1
          native_attributes = native_attributes.merge(
            min: minimum && serialize_number(minimum),
            max: maximum && serialize_number(maximum),
            step: native_attributes[:step] == "any" ? "any" : serialize_number(number_step)
          ).compact
        end
        input_attributes = component_aria_attributes(
          input_attributes,
          describedby: described_by,
          invalid: invalid_state ? "true" : nil,
          busy: (busy || loading) ? "true" : nil,
          readonly: read_only ? "true" : nil
        )
        input = tag.input(
          **input_attributes.merge(
            **native_attributes,
            id: input_id,
            class: input_classes,
            name: submitted_name,
            type: input_type,
            value: effective_value,
            disabled: (unavailable || read_only_range) ? true : nil,
            readonly: native_read_only ? true : nil,
            required: required ? true : nil
          ).compact
        )
        hidden_value = read_only_range && !unavailable ? tag.input(type: "hidden", name: name, value: effective_value) : nil
        help = help_text && content_tag(:span, help_text, class: "ag-#{component}__help", id: help_id)
        error_html = error && content_tag(:span, error, class: "ag-#{component}__error", id: error_id, "aria-live": "polite")
        root_classes = class_names_for(
          "ag-#{component}",
          unavailable && "is-disabled",
          read_only && "is-readonly",
          invalid_state && "is-invalid"
        )

        control = if input_type == "range"
          safe_join([
            content_tag(
              :div,
              safe_join([
                content_tag(:label, label, class: "ag-slider__label", for: input_id),
                content_tag(
                  :output,
                  effective_value,
                  class: "ag-slider__value",
                  for: input_id,
                  "data-aurelglyph-slider-output": ""
                )
              ]),
              class: "ag-slider__header"
            ),
            input,
            hidden_value
          ].compact)
        else
          decrement_target = stepped_number_target(effective_value, -1, minimum, maximum, number_step)
          increment_target = stepped_number_target(effective_value, 1, minimum, maximum, number_step)
          decrement_disabled = unavailable || read_only || decrement_target.nil?
          increment_disabled = unavailable || read_only || increment_target.nil?
          safe_join([
            content_tag(:label, label, class: "ag-number-field__label", for: input_id),
            content_tag(
              :div,
              safe_join([
                content_tag(
                  :button,
                  aurelglyph_icon("minus", decorative: true),
                  class: "ag-number-field__step",
                  type: "button",
                  disabled: decrement_disabled ? true : nil,
                  "aria-label": decrement_label,
                  "data-aurelglyph-number-step": "-1"
                ),
                input,
                content_tag(
                  :button,
                  aurelglyph_icon("plus", decorative: true),
                  class: "ag-number-field__step",
                  type: "button",
                  disabled: increment_disabled ? true : nil,
                  "aria-label": increment_label,
                  "data-aurelglyph-number-step": "1"
                )
              ]),
              class: "ag-number-field__control"
            )
          ])
        end

        content_tag(
          :div,
          safe_join([control, help, error_html].compact),
          class: root_classes,
          "data-disabled": unavailable ? "true" : nil,
          "data-busy": busy ? "true" : nil,
          "data-invalid": invalid_state ? "true" : nil,
          "data-loading": loading ? "true" : nil,
          "data-readonly": read_only ? "true" : nil,
          "data-aurelglyph-number-field": input_type == "number" ? "" : nil,
          "data-aurelglyph-slider": input_type == "range" ? "" : nil
        )
      end

      def menu_item_checked_state(role, value)
        return nil if role == "menuitem"

        normalized = value.nil? ? "false" : value.to_s
        allowed = role == "menuitemcheckbox" ? %w[false mixed true] : %w[false true]
        return normalized if allowed.include?(normalized)

        raise ArgumentError, "checked must be one of: #{allowed.join(', ')} for #{role}"
      end

      def render_layout_element(component, as:, attributes:, data: {}, &block)
        tag_name = validate_enum!(as, LAYOUT_TAGS, :as)
        html_attributes = attributes.dup
        classes = class_names_for("ag-#{component}", extract_html_attribute!(html_attributes, :class))
        html_attributes = component_data_attributes(html_attributes, data)

        content_tag(tag_name, capture_content(&block), html_attributes.merge(class: classes))
      end

      def component_data_attributes(attributes, data)
        html_attributes = attributes.dup
        existing_data = extract_html_attribute!(html_attributes, :data)
        existing_data = existing_data.is_a?(Hash) ? existing_data.dup : {}
        data.each do |key, value|
          normalized_name = key.to_s.tr("_", "-")
          dashed_name = "data-#{normalized_name}"
          html_attributes.delete(dashed_name)
          html_attributes.delete(dashed_name.to_sym)
          [key.to_s, normalized_name, normalized_name.tr("-", "_")].uniq.each do |candidate|
            existing_data.delete(candidate)
            existing_data.delete(candidate.to_sym)
          end
          existing_data[key] = value unless value.nil?
        end
        html_attributes[:data] = existing_data unless existing_data.empty?
        html_attributes
      end

      def component_aria_attributes(attributes, aria)
        html_attributes = attributes.dup
        existing_aria = extract_html_attribute!(html_attributes, :aria)
        existing_aria = existing_aria.is_a?(Hash) ? existing_aria.dup : {}
        aria.each do |key, value|
          normalized_name = key.to_s.tr("_", "-")
          compact_name = normalized_name.delete("-")
          html_attributes.delete("aria-#{normalized_name}")
          html_attributes.delete(:"aria-#{normalized_name}")
          [key.to_s, normalized_name, compact_name, normalized_name.tr("-", "_")].uniq.each do |candidate|
            existing_aria.delete(candidate)
            existing_aria.delete(candidate.to_sym)
          end
          existing_aria[compact_name.to_sym] = value unless value.nil?
        end
        html_attributes[:aria] = existing_aria unless existing_aria.empty?
        html_attributes
      end

      def without_html_attributes(attributes, *names)
        html_attributes = attributes.dup
        names.each { |name| extract_html_attribute!(html_attributes, name) }
        html_attributes
      end

      def extract_aria_attribute!(attributes, name)
        direct_names = ["aria-#{name.to_s.tr('_', '-')}", :"aria-#{name.to_s.tr('_', '-')}"]
        direct_values = direct_names.map { |key| attributes.delete(key) }
        value = direct_values.find { |candidate| !candidate.nil? }
        aria = extract_html_attribute!(attributes, :aria)
        if aria.is_a?(Hash)
          aria = aria.dup
          [name, name.to_s, name.to_s.delete("_"), name.to_s.tr("_", "-")].each do |key|
            candidate = aria.delete(key) || aria.delete(key.to_sym)
            value ||= candidate
          end
          attributes[:aria] = aria unless aria.empty?
        elsif aria
          attributes[:aria] = aria
        end
        value
      end

      def merge_idrefs(*values)
        ids = values.compact.flat_map { |value| value.to_s.split(/\s+/) }.reject(&:empty?).uniq
        ids.empty? ? nil : ids.join(" ")
      end

      def finite_number!(value, name)
        number = Float(value)
        raise ArgumentError, "#{name} must be a finite number" unless number.finite?

        number
      rescue ArgumentError, TypeError
        raise ArgumentError, "#{name} must be a finite number"
      end

      def coerce_finite_number(value)
        return nil if value.nil?

        number = Float(value)
        number.finite? ? number : nil
      rescue ArgumentError, TypeError
        nil
      end

      def serialize_number(number)
        number == number.to_i ? number.to_i : number
      end

      def stepped_number_target(value, direction, minimum, maximum, step)
        base = minimum || 0
        if value.nil?
          candidate = if minimum && direction.negative?
                        minimum
                      elsif minimum.nil? && maximum && maximum < base
                        base + (((maximum - base) / step).floor * step)
                      else
                        base + (step * direction)
                      end
        else
          current = value.to_f
          relative = (current - base) / step
          rounded = relative.round
          aligned = (relative - rounded).abs < 1e-10
          index = if direction.positive?
                    aligned ? rounded + 1 : relative.ceil
                  else
                    aligned ? rounded - 1 : relative.floor
                  end
          candidate = base + (index * step)
        end
        candidate = candidate.round(12)
        return nil if minimum && candidate < minimum
        return nil if maximum && candidate > maximum

        candidate
      end

      def validate_enum!(value, allowed, name)
        normalized = value.to_s.tr("_", "-")
        return normalized if allowed.include?(normalized)

        raise ArgumentError, "#{name} must be one of: #{allowed.join(', ')}"
      end

      def spacing_css_value(value)
        normalized = value.to_s
        named = {
          "none" => "0",
          "xs" => "var(--ag-space-1)",
          "sm" => "var(--ag-space-2)",
          "md" => "var(--ag-space-4)",
          "lg" => "var(--ag-space-6)",
          "xl" => "var(--ag-space-8)"
        }
        return named.fetch(normalized) if named.key?(normalized)
        return "var(--ag-space-#{normalized})" if SPACE_STEPS.include?(normalized)

        css_dimension!(normalized, :gap)
      end

      def css_dimension!(value, name)
        normalized = value.to_s
        return normalized if normalized.match?(/\A(?:0|\d+(?:\.\d+)?(?:px|rem|em|ch|%))\z/)

        raise ArgumentError, "#{name} must be a non-negative CSS length"
      end

      def grid_column_value(value)
        count = Integer(value)
        raise ArgumentError, "columns must be between 1 and 12" unless count.between?(1, 12)

        count.to_s
      rescue ArgumentError, TypeError
        raise ArgumentError, "columns must be between 1 and 12"
      end

      def grid_target_width(column_value)
        percentage = (100.0 / Integer(column_value)).round(12)
        "#{percentage.to_s.sub(/\.0\z/, '')}%"
      end

      def merge_component_style(existing, properties)
        declarations = properties.compact.map { |name, value| "#{name}: #{value}" }
        return existing if declarations.empty?

        [existing.to_s.sub(/;?\s*\z/, ""), declarations.join("; ")].reject(&:empty?).join("; ")
      end
    end
  end
end
