#!/usr/bin/env ruby

require "optparse"
require "set"
require_relative "lib/photo_project_scaffold"

class PhotoProjectScaffoldWatcher
  def initialize(root:, interval: 1.0)
    @root = File.expand_path(root)
    @interval = interval
    @projects_root = File.join(@root, "_projects")
    @known_files = scan_markdown_files.to_set
    @pending_files = Set.new
  end

  def run
    puts "Watching #{@projects_root} for new CMS-created project files..."

    loop do
      current_files = scan_markdown_files.to_set
      register_new_files(current_files)
      process_pending_files
      prune_missing_files(current_files)
      sleep @interval
    end
  rescue Interrupt
    puts "\nStopped photo project scaffold watcher."
  end

  private

  def scan_markdown_files
    Dir.glob(File.join(@projects_root, "*", "*.markdown")).sort
  end

  def register_new_files(current_files)
    (current_files - @known_files - @pending_files).each do |path|
      @pending_files << path
      puts "Detected new project entry: #{relative_to_root(path)}"
    end
  end

  def process_pending_files
    @pending_files.to_a.each do |path|
      begin
        scaffold = PhotoProjectScaffold.from_existing_markdown(
          markdown_path: path,
          root: @root,
          skip_existing: true
        )
        scaffold.run
        puts "Scaffolded support files for #{relative_to_root(path)}"
        @known_files << path
        @pending_files.delete(path)
      rescue PhotoProjectScaffold::PendingWriteError
        next
      rescue StandardError => error
        warn "Failed to scaffold #{relative_to_root(path)}: #{error.message}"
        @known_files << path
        @pending_files.delete(path)
      end
    end
  end

  def prune_missing_files(current_files)
    @known_files &= current_files
    @pending_files &= current_files
  end

  def relative_to_root(path)
    path.delete_prefix("#{@root}/")
  end
end

options = {
  root: File.expand_path("..", __dir__),
  interval: 1.0,
}

parser = OptionParser.new do |opts|
  opts.banner = "Usage: ruby scripts/watch_photo_project_scaffold.rb"

  opts.on("--root PATH", "Optional project root override for testing") do |root|
    options[:root] = root
  end

  opts.on("--interval SECONDS", Float, "Polling interval in seconds, defaults to 1.0") do |interval|
    options[:interval] = interval
  end
end

begin
  parser.parse!
  PhotoProjectScaffoldWatcher.new(root: options[:root], interval: options[:interval]).run
rescue OptionParser::ParseError, ArgumentError => error
  warn error.message
  warn parser
  exit 1
end
