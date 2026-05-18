# frozen_string_literal: true

require "pathname"

require "aurelglyph/tokens"
require "aurelglyph/rails/helper"
require "aurelglyph/rails/version"

module Aurelglyph
  module Rails
    class << self
      def root
        @root ||= Pathname.new(File.expand_path("../..", __dir__))
      end

      def asset_path
        root.join("app/assets")
      end
    end
  end
end

require "aurelglyph/rails/engine" if defined?(::Rails::Engine)
