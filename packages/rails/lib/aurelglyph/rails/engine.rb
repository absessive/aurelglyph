# frozen_string_literal: true

require "rails/engine"

module Aurelglyph
  module Rails
    class Engine < ::Rails::Engine
      isolate_namespace Aurelglyph::Rails

      initializer "aurelglyph_rails.helpers" do
        ActiveSupport.on_load(:action_view) do
          include Aurelglyph::Rails::Helper
        end
      end
    end
  end
end
