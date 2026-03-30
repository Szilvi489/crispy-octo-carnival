#!/usr/bin/env ruby

require "optparse"
require_relative "lib/photo_project_scaffold"

options = {
  root: File.expand_path("..", __dir__),
  force: false,
  description: "",
  permalink: "",
}

parser = OptionParser.new do |opts|
  opts.banner = "Usage: ruby scripts/scaffold_photo_project.rb --slug myGallery --title \"My Gallery\""

  opts.on("--slug SLUG", "Code slug used for file and folder names, for example cambodiaStreet") do |slug|
    options[:slug] = slug
  end

  opts.on("--title TITLE", "Human title used in front matter, for example \"Cambodia, Siem Reap\"") do |title|
    options[:title] = title
  end

  opts.on("--description TEXT", "Optional description for the project markdown") do |description|
    options[:description] = description
  end

  opts.on("--permalink PATH", "Optional permalink override, for example /projects/cambodia-siem-reap/") do |permalink|
    options[:permalink] = permalink
  end

  opts.on("--root PATH", "Optional project root override for testing") do |root|
    options[:root] = root
  end

  opts.on("--force", "Overwrite files if they already exist") do
    options[:force] = true
  end
end

begin
  parser.parse!
  scaffold = PhotoProjectScaffold.new(
    root: options[:root],
    slug: options[:slug],
    title: options[:title],
    description: options[:description],
    permalink: options[:permalink],
    force: options[:force]
  )
  scaffold.run
  puts "Created photo project scaffold for '#{scaffold.code_slug}' in #{scaffold.root_path}"
rescue OptionParser::ParseError, ArgumentError => error
  warn error.message
  warn parser
  exit 1
end
