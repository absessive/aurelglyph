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
      STEPPER_STATUSES = %w[current completed upcoming error].freeze

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

      def aurelglyph_more_information(label: "More information", trigger_label: "More information",
                                      open: false, placement: "bottom", disabled: false,
                                      trigger_attributes: {}, **attributes, &block)
        raise ArgumentError, "a block is required" unless block

        html_attributes = attributes.dup
        html_attributes[:class] = class_names_for(
          "ag-more-information",
          extract_html_attribute!(html_attributes, :class)
        )
        more_information_trigger_attributes = trigger_attributes.dup
        more_information_trigger_attributes[:class] = class_names_for(
          "ag-more-information__trigger",
          extract_html_attribute!(more_information_trigger_attributes, :class)
        )
        more_information_trigger_attributes = component_aria_attributes(
          more_information_trigger_attributes,
          label: label
        )
        trigger = safe_join([
          aurelglyph_icon("info", decorative: true),
          content_tag(:span, trigger_label, class: "ag-more-information__trigger-label")
        ])
        content = content_tag(:div, capture_content(&block), class: "ag-more-information__content")

        aurelglyph_popover(
          trigger: trigger,
          label: label,
          open: open,
          placement: placement,
          disabled: disabled,
          trigger_attributes: more_information_trigger_attributes,
          **html_attributes
        ) { content }
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
        html_attributes = without_html_attributes(html_attributes, :disabled, :role)
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

      def aurelglyph_link(label, href: nil, external: false, unavailable: false,
                          external_label: "Opens in a new tab", unavailable_label: "Unavailable", **attributes)
        unavailable = unavailable || href.nil? || href.to_s.empty?
        html_attributes = attributes.dup
        classes = class_names_for(
          "ag-link",
          external && "ag-link--external",
          unavailable && "is-unavailable",
          extract_html_attribute!(html_attributes, :class)
        )
        content = safe_join([
          content_tag(:span, label, class: "ag-link__label"),
          external && !unavailable ? aurelglyph_icon("external-link", decorative: true, class: "ag-link__icon") : nil,
          external && !unavailable ? content_tag(:span, external_label, class: "ag-sr-only ag-link__external") : nil,
          unavailable ? content_tag(:span, unavailable_label, class: "ag-sr-only ag-link__unavailable") : nil
        ].compact)

        if unavailable
          html_attributes = sanitize_unavailable_link_attributes(html_attributes)
          html_attributes = component_aria_attributes(html_attributes, disabled: "true")
          html_attributes = component_data_attributes(html_attributes, disabled: "true", unavailable: "true")
          content_tag(:span, content, html_attributes.merge(class: classes))
        else
          html_attributes = without_html_attributes(html_attributes, :href)
          target = extract_html_attribute!(html_attributes, :target)
          rel = extract_html_attribute!(html_attributes, :rel)
          if external
            target ||= "_blank"
            rel = [rel, "noopener", "noreferrer"].compact.flat_map { |entry| entry.to_s.split(/\s+/) }.uniq.join(" ")
          end
          content_tag(:a, content, html_attributes.merge(class: classes, href: href, rel: rel, target: target).compact)
        end
      end

      def aurelglyph_chip(label:, selected: false, selectable: true, removable: false,
                          disabled: false, read_only: false, loading: false, busy: false,
                          name: nil, value: nil, selected_label: "Selected",
                          unselected_label: "Not selected", remove_label: "Remove item", **attributes)
        raise ArgumentError, "chip must be selectable or removable" unless selectable || removable

        unavailable = disabled || loading
        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-chip")
        classes = class_names_for(
          "ag-chip",
          selected && "is-selected",
          unavailable && "is-disabled",
          extract_html_attribute!(html_attributes, :class)
        )
        html_attributes = without_html_attributes(html_attributes, :role)
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_chip: "",
          busy: busy ? "true" : nil,
          default_selected: selected ? "true" : "false",
          disabled: unavailable ? "true" : nil,
          loading: loading ? "true" : nil,
          readonly: read_only ? "true" : nil,
          selected: selected ? "true" : "false",
          selected_label: selected_label,
          unselected_label: unselected_label
        )
        label_html = content_tag(:span, label, class: "ag-chip__label")
        state_html = content_tag(
          :span,
          selected ? selected_label : unselected_label,
          class: "ag-chip__state",
          "aria-hidden": "true",
          "data-aurelglyph-chip-state": ""
        )
        primary = if selectable
          content_tag(
            :button,
            safe_join([label_html, state_html]),
            class: "ag-chip__select",
            type: "button",
            disabled: unavailable ? true : nil,
            "aria-disabled": read_only ? "true" : nil,
            "aria-pressed": selected ? "true" : "false",
            "data-aurelglyph-chip-select": ""
          )
        else
          content_tag(:span, safe_join([label_html, state_html]), class: "ag-chip__content")
        end
        remove = if removable
          content_tag(
            :button,
            aurelglyph_icon("close", decorative: true),
            class: "ag-chip__remove",
            type: "button",
            disabled: unavailable ? true : nil,
            "aria-disabled": read_only ? "true" : nil,
            "aria-label": remove_label,
            "data-aurelglyph-chip-remove": ""
          )
        end
        hidden_value = if name
          tag.input(
            type: "hidden",
            name: name,
            value: value.nil? ? label : value,
            disabled: (!selected || unavailable) ? true : nil,
            "data-aurelglyph-chip-value": ""
          )
        end

        content_tag(
          :span,
          safe_join([primary, remove, hidden_value].compact),
          component_aria_attributes(html_attributes, busy: (busy || loading) ? "true" : nil).merge(id: root_id, class: classes)
        )
      end

      def aurelglyph_password_field(name:, label:, value: nil, autocomplete: "current-password",
                                    placeholder: nil, help_text: nil, error: nil, disabled: false,
                                    read_only: false, loading: false, busy: false, required: false,
                                    invalid: false, show_label: "Show password",
                                    hide_label: "Hide password", input_attributes: {}, **attributes)
        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-password-field")
        classes = class_names_for(
          "ag-field",
          "ag-input-group",
          "ag-password-field",
          (disabled || loading) && "is-disabled",
          read_only && "is-readonly",
          (invalid || !error.nil?) && "is-invalid",
          extract_html_attribute!(html_attributes, :class)
        )
        input_html_attributes = input_attributes.dup
        input_id = extract_html_attribute!(input_html_attributes, :id) || "#{root_id}-input"
        input_classes = class_names_for("ag-input", "ag-input-group__input", "ag-password-field__input", extract_html_attribute!(input_html_attributes, :class))
        input_html_attributes = without_html_attributes(
          input_html_attributes,
          :autocomplete,
          :disabled,
          :name,
          :readonly,
          :required,
          :type,
          :value
        )
        help_id = help_text && "#{root_id}-help"
        error_id = error && "#{root_id}-error"
        invalid_state = invalid || !error.nil?
        unavailable = disabled || loading
        input_html_attributes = component_aria_attributes(
          input_html_attributes,
          describedby: merge_idrefs(extract_aria_attribute!(input_html_attributes, :describedby), help_id, error_id),
          invalid: invalid_state ? "true" : nil,
          busy: (busy || loading) ? "true" : nil
        )
        input = tag.input(
          **input_html_attributes.merge(
            id: input_id,
            class: input_classes,
            name: name,
            type: "password",
            value: value,
            autocomplete: autocomplete,
            placeholder: placeholder,
            disabled: unavailable ? true : nil,
            readonly: read_only ? true : nil,
            required: required ? true : nil,
            autocapitalize: "none",
            spellcheck: "false",
            "data-aurelglyph-password-input": ""
          ).compact
        )
        reveal = content_tag(
          :button,
          safe_join([
            content_tag(:span, aurelglyph_icon("eye", decorative: true), "data-aurelglyph-password-show-icon": ""),
            content_tag(:span, aurelglyph_icon("eye-off", decorative: true), hidden: true, "data-aurelglyph-password-hide-icon": "")
          ]),
          class: "ag-password-field__toggle ag-input-group__action",
          type: "button",
          disabled: unavailable ? true : nil,
          "aria-controls": input_id,
          "aria-label": show_label,
          "aria-pressed": "false",
          "data-aurelglyph-password-toggle": ""
        )
        help = help_text && content_tag(:span, help_text, class: "ag-field__help ag-input-group__help ag-password-field__help", id: help_id)
        error_html = error && content_tag(
          :span,
          error,
          class: "ag-field__error ag-input-group__error ag-password-field__error",
          id: error_id,
          "aria-live": "polite"
        )
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_password_field: "",
          busy: busy ? "true" : nil,
          disabled: unavailable ? "true" : nil,
          hide_label: hide_label,
          invalid: invalid_state ? "true" : nil,
          loading: loading ? "true" : nil,
          readonly: read_only ? "true" : nil,
          show_label: show_label
        )

        content_tag(
          :div,
          safe_join([
            content_tag(:label, label, class: "ag-field__label ag-input-group__label ag-password-field__label", for: input_id),
            content_tag(:div, safe_join([input, reveal]), class: "ag-input-group__control ag-password-field__control"),
            help,
            error_html
          ].compact),
          html_attributes.merge(id: root_id, class: classes)
        )
      end

      def aurelglyph_input_group(name:, label:, value: nil, type: "text", prefix: nil,
                                 prefix_description: nil, suffix: nil, suffix_description: nil,
                                 leading_action: nil, trailing_action: nil, placeholder: nil,
                                 help_text: nil, error: nil, disabled: false, read_only: false,
                                 loading: false, busy: false, required: false, invalid: false,
                                 input_attributes: {}, **attributes)
        raise ArgumentError, "prefix_description is required when prefix is present" if prefix && prefix_description.to_s.empty?
        raise ArgumentError, "suffix_description is required when suffix is present" if suffix && suffix_description.to_s.empty?

        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-input-group")
        invalid_state = invalid || !error.nil?
        unavailable = disabled || loading
        classes = class_names_for(
          "ag-field",
          "ag-input-group",
          unavailable && "is-disabled",
          read_only && "is-readonly",
          invalid_state && "is-invalid",
          extract_html_attribute!(html_attributes, :class)
        )
        input_html_attributes = input_attributes.dup
        input_id = extract_html_attribute!(input_html_attributes, :id) || "#{root_id}-input"
        input_classes = class_names_for("ag-input", "ag-input-group__input", extract_html_attribute!(input_html_attributes, :class))
        input_html_attributes = without_html_attributes(
          input_html_attributes,
          :disabled,
          :name,
          :placeholder,
          :readonly,
          :required,
          :type,
          :value
        )
        prefix_description_id = prefix && "#{root_id}-prefix-description"
        suffix_description_id = suffix && "#{root_id}-suffix-description"
        help_id = help_text && "#{root_id}-help"
        error_id = error && "#{root_id}-error"
        input_html_attributes = component_aria_attributes(
          input_html_attributes,
          describedby: merge_idrefs(
            extract_aria_attribute!(input_html_attributes, :describedby),
            prefix_description_id,
            suffix_description_id,
            help_id,
            error_id
          ),
          invalid: invalid_state ? "true" : nil,
          busy: (busy || loading) ? "true" : nil
        )
        input = tag.input(
          **input_html_attributes.merge(
            id: input_id,
            class: input_classes,
            name: name,
            type: type,
            value: value,
            placeholder: placeholder,
            disabled: unavailable ? true : nil,
            readonly: read_only ? true : nil,
            required: required ? true : nil
          ).compact
        )
        prefix_html = prefix && content_tag(
          :span,
          content_tag(:span, prefix, class: "ag-input-group__addon-value"),
          class: "ag-input-group__addon ag-input-group__addon--leading",
          "aria-hidden": "true"
        )
        suffix_html = suffix && content_tag(
          :span,
          content_tag(:span, suffix, class: "ag-input-group__addon-value"),
          class: "ag-input-group__addon ag-input-group__addon--trailing",
          "aria-hidden": "true"
        )
        prefix_description_html = prefix && content_tag(:span, prefix_description, class: "ag-sr-only ag-input-group__description", id: prefix_description_id)
        suffix_description_html = suffix && content_tag(:span, suffix_description, class: "ag-sr-only ag-input-group__description", id: suffix_description_id)
        leading_action_html = leading_action && content_tag(:span, leading_action, class: "ag-input-group__action ag-input-group__action--leading")
        trailing_action_html = trailing_action && content_tag(:span, trailing_action, class: "ag-input-group__action ag-input-group__action--trailing")
        help = help_text && content_tag(:span, help_text, class: "ag-field__help ag-input-group__help", id: help_id)
        error_html = error && content_tag(
          :span,
          error,
          class: "ag-field__error ag-input-group__error",
          id: error_id,
          "aria-live": "polite"
        )
        html_attributes = component_data_attributes(
          html_attributes,
          busy: busy ? "true" : nil,
          disabled: unavailable ? "true" : nil,
          invalid: invalid_state ? "true" : nil,
          loading: loading ? "true" : nil,
          readonly: read_only ? "true" : nil
        )

        content_tag(
          :div,
          safe_join([
            content_tag(:label, label, class: "ag-field__label ag-input-group__label", for: input_id),
            content_tag(
              :div,
              safe_join([leading_action_html, prefix_html, input, suffix_html, trailing_action_html].compact),
              class: "ag-input-group__control"
            ),
            prefix_description_html,
            suffix_description_html,
            help,
            error_html
          ].compact),
          html_attributes.merge(id: root_id, class: classes)
        )
      end

      def aurelglyph_validation_summary(issues:, title: "Review the following errors",
                                        focus_key: nil, announcement_key: nil,
                                        announcement_label: ->(heading, count) { "#{heading}. #{count} fields need attention" },
                                        **attributes)
        return nil if issues.empty?

        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-validation-summary")
        classes = class_names_for("ag-validation-summary", extract_html_attribute!(html_attributes, :class))
        title_id = "#{root_id}-title"
        issue_items = issues.map do |issue|
          field_id = issue.fetch(:field_id).to_s
          raise ArgumentError, "field_id must not be empty" if field_id.empty?

          link = content_tag(
            :a,
            issue.fetch(:message),
            class: "ag-validation-summary__link",
            href: "##{field_id}",
            "data-aurelglyph-validation-target": field_id
          )
          content_tag(:li, link, class: "ag-validation-summary__item")
        end
        announcement = if announcement_key
          raise ArgumentError, "announcement_label must respond to call" unless announcement_label.respond_to?(:call)

          content_tag(
            :span,
            nil,
            class: "ag-validation-summary__announcement",
            "aria-atomic": "true",
            "aria-live": "polite",
            "data-aurelglyph-validation-announcement": announcement_label.call(title, issues.length)
          )
        end
        html_attributes = without_html_attributes(html_attributes, :role, :tabindex)
        html_attributes = component_aria_attributes(html_attributes, labelledby: title_id)
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_validation_summary: "",
          announcement_key: announcement_key,
          focus_key: focus_key
        )

        content_tag(
          :section,
          safe_join([
            content_tag(:h2, title, class: "ag-validation-summary__title", id: title_id),
            content_tag(:ul, safe_join(issue_items), class: "ag-validation-summary__list"),
            announcement
          ].compact),
          html_attributes.merge(id: root_id, class: classes, tabindex: focus_key ? -1 : nil).compact
        )
      end

      def aurelglyph_accordion(items:, multiple: false, heading_level: 3, **attributes)
        heading_level = whole_number!(heading_level, :heading_level)
        raise ArgumentError, "heading_level must be between 1 and 6" unless (1..6).cover?(heading_level)

        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-accordion")
        classes = class_names_for("ag-accordion", extract_html_attribute!(html_attributes, :class))
        single_open_rendered = false
        items_html = items.each_with_index.map do |item, index|
          item_key = item[:id]&.to_s
          item_id = "#{root_id}-item-#{index}"
          summary_id = "#{item_id}-summary"
          panel_id = "#{item_id}-panel"
          disabled = !!item[:disabled]
          requested_open = !!item[:open]
          open = requested_open && (multiple || !single_open_rendered)
          single_open_rendered ||= open
          item_classes = class_names_for(
            "ag-accordion__item",
            "ag-disclosure",
            disabled && "is-disabled",
            open && "is-open",
            item.dig(:attributes, :class)
          )
          heading = content_tag(
            :span,
            safe_join([
              content_tag(:span, item.fetch(:title), class: "ag-disclosure__title"),
              aurelglyph_icon("chevron-down", decorative: true, class: "ag-disclosure__icon")
            ]),
            class: "ag-disclosure__heading-level",
            role: "heading",
            "aria-level": heading_level
          )
          panel = content_tag(
            :div,
            content_tag(:div, accordion_item_content(item), class: "ag-disclosure__panel-inner"),
            class: "ag-accordion__panel ag-disclosure__panel",
            id: panel_id,
            role: "region",
            hidden: disabled && !open ? true : nil,
            "aria-labelledby": summary_id
          )

          if disabled
            content_tag(
              :section,
              safe_join([content_tag(:div, heading, class: "ag-disclosure__trigger", id: summary_id), open ? panel : nil].compact),
              id: item_id,
              class: item_classes,
              "aria-disabled": "true",
              "data-item-key": item_key,
              "data-disabled": "true"
            )
          else
            content_tag(
              :details,
              safe_join([
                content_tag(:summary, heading, class: "ag-disclosure__trigger", id: summary_id, "aria-controls": panel_id),
                panel
              ]),
              id: item_id,
              class: item_classes,
              "data-item-key": item_key,
              open: open ? true : nil,
              name: multiple ? nil : root_id
            )
          end
        end
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_accordion: "",
          multiple: multiple ? "true" : "false"
        )

        content_tag(:div, safe_join(items_html), html_attributes.merge(id: root_id, class: classes))
      end

      def aurelglyph_stepper(items:, label: "Progress", current_id: nil, current_label: "Current",
                             completed_label: "Completed", upcoming_label: "Upcoming",
                             error_label: "Error", disabled_label: "Unavailable", **attributes)
        html_attributes = attributes.dup
        classes = class_names_for("ag-stepper", extract_html_attribute!(html_attributes, :class))
        html_attributes = without_html_attributes(html_attributes, :role)
        html_attributes = component_aria_attributes(html_attributes, label: label)
        state_labels = {
          "current" => current_label,
          "completed" => completed_label,
          "upcoming" => upcoming_label,
          "error" => error_label
        }
        normalized_items = items.map do |item|
          [item, validate_enum!(item.fetch(:status, "upcoming"), STEPPER_STATUSES, :status)]
        end
        current_index = if current_id.nil?
          normalized_items.index { |_item, status| status == "current" }
        else
          normalized_items.index { |item, _status| item.key?(:id) && item[:id].to_s == current_id.to_s }
        end
        items_html = normalized_items.each_with_index.map do |(item, declared_status), index|
          current = index == current_index
          status = declared_status == "current" && !current ? "upcoming" : declared_status
          disabled = !!item[:disabled]
          marker = case status
                   when "completed" then aurelglyph_icon("check", decorative: true)
                   when "error" then aurelglyph_icon("warning", decorative: true)
                   else content_tag(:span, index + 1, "aria-hidden": "true")
                   end
          marker_html = content_tag(:span, marker, class: "ag-stepper__marker")
          status_copy = safe_join([
            current && status != "current" ? content_tag(:span, current_label, class: "ag-stepper__status ag-stepper__status--current") : nil,
            content_tag(:span, state_labels.fetch(status), class: "ag-stepper__status"),
            disabled ? content_tag(:span, disabled_label, class: "ag-stepper__disabled") : nil
          ].compact)
          content = safe_join([
            marker_html,
            content_tag(
              :span,
              safe_join([
                content_tag(:span, item.fetch(:label), class: "ag-stepper__label"),
                status_copy,
                item[:description] && content_tag(:span, item[:description], class: "ag-stepper__description")
              ].compact),
              class: "ag-stepper__content"
            )
          ])
          common = {
            class: "ag-stepper__action",
            "aria-current": current ? "step" : nil,
            "aria-disabled": disabled ? "true" : nil
          }.compact
          action = if item[:href] && !disabled
            content_tag(:a, content, common.merge(href: item[:href]))
          else
            content_tag(:span, content, common)
          end
          content_tag(
            :li,
            action,
            class: class_names_for(
              "ag-stepper__item",
              "is-#{status}",
              current && status != "current" && "is-current",
              disabled && "is-disabled",
              item.dig(:attributes, :class)
            ),
            "data-status": status,
            "data-current": current ? "true" : nil,
            "data-disabled": disabled ? "true" : nil
          )
        end

        content_tag(
          :nav,
          content_tag(:ol, safe_join(items_html), class: "ag-stepper__list"),
          html_attributes.merge(class: classes)
        )
      end

      def aurelglyph_rating(name:, label:, value: nil, max: 5, help_text: nil, error: nil,
                            disabled: false, read_only: false, loading: false, busy: false,
                            required: false, invalid: false, clearable: true,
                            clear_label: "Clear rating",
                            value_label: ->(rating, total) { "#{rating} of #{total}" }, **attributes)
        maximum = normalize_rating_max(max)
        raise ArgumentError, "value_label must respond to call" unless value_label.respond_to?(:call)

        selected = normalize_rating_value(value, maximum)
        html_attributes = attributes.dup
        root_id = extract_html_attribute!(html_attributes, :id) || unique_dom_id("ag-rating")
        classes = class_names_for(
          "ag-rating",
          (disabled || loading) && "is-disabled",
          read_only && "is-readonly",
          (invalid || !error.nil?) && "is-invalid",
          extract_html_attribute!(html_attributes, :class)
        )
        help_id = help_text && "#{root_id}-help"
        error_id = error && "#{root_id}-error"
        invalid_state = invalid || !error.nil?
        unavailable = disabled || loading
        radio_name = read_only ? nil : (name || root_id)
        options = (1..maximum).map do |rating|
          option_id = "#{root_id}-#{rating}"
          input = tag.input(
            id: option_id,
            class: "ag-rating__input",
            type: "radio",
            name: radio_name,
            value: rating,
            checked: selected == rating ? true : nil,
            disabled: (unavailable || read_only) ? true : nil,
            required: (required && !read_only) ? true : nil,
            "aria-label": value_label.call(rating, maximum),
            "aria-invalid": invalid_state ? "true" : nil,
            "data-aurelglyph-rating-input": "",
            "data-value-label": value_label.call(rating, maximum)
          )
          content_tag(
            :label,
            safe_join([input, aurelglyph_icon("star", decorative: true, class: "ag-rating__star")]),
            class: "ag-rating__option",
            "data-filled": rating <= selected ? "true" : nil,
            for: option_id
          )
        end
        hidden_value = if read_only && !unavailable && name
          tag.input(type: "hidden", name: name, value: selected)
        end
        clear = if clearable && !required && !read_only
          content_tag(
            :button,
            clear_label,
            class: "ag-rating__clear",
            type: "button",
            disabled: (unavailable || selected.zero?) ? true : nil,
            "data-aurelglyph-rating-clear": ""
          )
        end
        value_html = content_tag(:span, value_label.call(selected, maximum), class: "ag-rating__value", "data-aurelglyph-rating-value": "")
        zero_value = if name && !unavailable && !read_only
          tag.input(
            type: "hidden",
            name: name,
            value: 0,
            disabled: selected.positive? ? true : nil,
            "data-aurelglyph-rating-zero": ""
          )
        end
        help = help_text && content_tag(:span, help_text, class: "ag-field__help ag-rating__help", id: help_id)
        error_html = error && content_tag(:span, error, class: "ag-field__error ag-rating__error", id: error_id, "aria-live": "polite")
        html_attributes = without_html_attributes(html_attributes, :disabled)
        supplied_described_by = extract_aria_attribute!(html_attributes, :describedby)
        html_attributes = component_aria_attributes(
          html_attributes,
          describedby: merge_idrefs(supplied_described_by, help_id, error_id),
          invalid: invalid_state ? "true" : nil,
          busy: (busy || loading) ? "true" : nil,
          required: required ? "true" : nil,
          readonly: read_only ? "true" : nil
        )
        html_attributes = component_data_attributes(
          html_attributes,
          aurelglyph_rating: "",
          busy: busy ? "true" : nil,
          disabled: unavailable ? "true" : nil,
          empty_label: value_label.call(0, maximum),
          invalid: invalid_state ? "true" : nil,
          loading: loading ? "true" : nil,
          readonly: read_only ? "true" : nil,
          value: selected
        )

        content_tag(
          :fieldset,
          safe_join([
            content_tag(
              :legend,
              safe_join([
                content_tag(:span, label, class: "ag-rating__label-text"),
                invalid_state ? aurelglyph_icon("warning", decorative: true, class: "ag-rating__invalid-marker") : nil
              ].compact),
              class: "ag-field__label ag-rating__label"
            ),
            content_tag(:div, safe_join([*options, clear].compact), class: "ag-rating__options"),
            hidden_value,
            zero_value,
            value_html,
            help,
            error_html
          ].compact),
          html_attributes.merge(id: root_id, class: classes, role: "radiogroup", disabled: unavailable ? true : nil).compact
        )
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

      def accordion_item_content(item)
        content = item.fetch(:content)
        content.respond_to?(:call) ? capture_content(&content) : content
      end

      def normalize_rating_value(value, maximum)
        number = Float(value || 0)
        number = 0 unless number.finite?
        [[number.round, 0].max, maximum].min
      rescue ArgumentError, TypeError
        0
      end

      def normalize_rating_max(value)
        number = Float(value)
        number = 5 unless number.finite?
        [[number.floor, 1].max, 20].min
      rescue ArgumentError, TypeError
        5
      end

      def sanitize_unavailable_link_attributes(attributes)
        html_attributes = without_html_attributes(
          attributes,
          :download,
          :href,
          :ping,
          :referrerpolicy,
          :rel,
          :role,
          :tabindex,
          :target
        )
        html_attributes.delete_if { |name, _value| name.to_s.match?(/\Aon/i) }
        data = extract_html_attribute!(html_attributes, :data)
        if data.is_a?(Hash)
          safe_data = data.reject do |name, _value|
            name.to_s.tr("_", "-").match?(/(?:\A|-)(?:action|controller|method)\z/)
          end
          html_attributes[:data] = safe_data unless safe_data.empty?
        end
        html_attributes
      end

      def whole_number!(value, name)
        valid = value.is_a?(Integer) || value.to_s.match?(/\A[+-]?\d+\z/)
        raise ArgumentError, "#{name} must be a whole number" unless valid

        Integer(value)
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
