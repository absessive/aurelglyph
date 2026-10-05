# frozen_string_literal: true

require "rubygems"

minimum_patch_by_line = {
  "3.3" => Gem::Version.new("3.3.12"),
  "3.4" => Gem::Version.new("3.4.11"),
  "4.0" => Gem::Version.new("4.0.7")
}.freeze

current = Gem::Version.new(RUBY_VERSION)
line = current.segments.first(2).join(".")
minimum = minimum_patch_by_line[line]

abort "Ruby #{RUBY_VERSION} is not a reviewed Aurelglyph workspace runtime." unless minimum
abort "Ruby #{RUBY_VERSION} is below the reviewed #{line} security floor #{minimum}." if current < minimum

puts "Ruby runtime policy passed: #{RUBY_VERSION} satisfies the reviewed #{line} floor #{minimum}."
