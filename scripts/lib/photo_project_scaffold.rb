require "fileutils"
require "yaml"
require "date"

class PhotoProjectScaffold
  class PendingWriteError < StandardError; end

  def self.from_existing_markdown(markdown_path:, root:, force: false, skip_existing: true)
    markdown_path = File.expand_path(markdown_path)
    root = File.expand_path(root)
    slug = File.basename(markdown_path, ".markdown")
    data = load_front_matter(markdown_path)

    new(
      root: root,
      slug: slug,
      title: data["title"].to_s.strip.empty? ? humanize_slug(slug) : data["title"].to_s,
      description: data["description"].to_s,
      permalink: data["permalink"].to_s,
      force: force,
      skip_existing: skip_existing,
      write_markdown: true,
      overwrite_markdown: true,
      existing_data: data
    )
  end

  def self.load_front_matter(markdown_path)
    content = File.read(markdown_path)
    front_matter = content[/\A---\s*\n(.*?)\n---\s*(?:\n|\z)/m, 1]
    raise PendingWriteError, "Front matter not ready yet." unless front_matter

    YAML.safe_load(front_matter, aliases: true) || {}
  rescue Psych::SyntaxError => error
    raise PendingWriteError, error.message
  end

  def self.humanize_slug(slug)
    slug
      .gsub(/([a-z0-9])([A-Z])/, '\1 \2')
      .tr("_-", " ")
      .split
      .map { |word| word[0] ? word[0].upcase + word[1..] : word }
      .join(" ")
  end

  def initialize(root:, slug:, title:, description: "", permalink: "", force: false, skip_existing: false, write_markdown: true, overwrite_markdown: false, existing_data: {})
    @root = File.expand_path(root)
    @slug = slug.to_s.strip
    @title = title.to_s.strip
    @description = description.to_s.strip
    @permalink = permalink.to_s.strip
    @force = force
    @skip_existing = skip_existing
    @write_markdown = write_markdown
    @overwrite_markdown = overwrite_markdown
    @existing_data = existing_data || {}
  end

  def run
    validate!
    ensure_targets_are_available! unless skip_existing
    create_directories
    write_files
  end

  def root_path
    @root
  end

  def code_slug
    @slug
  end

  def title
    @title
  end

  private

  attr_reader :description, :force, :skip_existing, :write_markdown, :overwrite_markdown, :existing_data

  def validate!
    raise ArgumentError, "Slug is required." if code_slug.empty?
    raise ArgumentError, "Title is required." if title.empty?

    unless code_slug.match?(/\A[a-zA-Z0-9_-]+\z/)
      raise ArgumentError, "Slug may only contain letters, numbers, underscores, and hyphens."
    end
  end

  def ensure_targets_are_available!
    return if force

    existing_targets = file_targets.select { |path, _| File.exist?(path) }.keys
    return if existing_targets.empty?

    message = +"Refusing to overwrite existing files:\n"
    existing_targets.each do |path|
      message << "  - #{relative_to_root(path)}\n"
    end
    message << "Re-run with --force to overwrite."
    raise ArgumentError, message
  end

  def create_directories
    directories.each do |directory|
      FileUtils.mkdir_p(directory)
    end
  end

  def write_files
    file_targets.each do |path, content|
      if skip_existing && File.exist?(path)
        next unless path == project_markdown_path && overwrite_markdown
      end

      File.write(path, content)
    end
  end

  def file_targets
    targets = {
      include_path => include_content,
      css_path => css_content,
      variables_css_path => variables_css_content,
      js_path => js_content,
      gallery_gitkeep_path => "",
      hero_gitkeep_path => "",
      thumbnails_gitkeep_path => "",
    }

    if write_markdown
      targets = { project_markdown_path => markdown_content }.merge(targets)
    end

    targets
  end

  def directories
    [
      File.dirname(project_markdown_path),
      File.dirname(include_path),
      File.dirname(css_path),
      File.dirname(js_path),
      File.dirname(gallery_gitkeep_path),
      File.dirname(hero_gitkeep_path),
      File.dirname(thumbnails_gitkeep_path),
    ]
  end

  def kebab_slug
    @kebab_slug ||= code_slug
      .gsub(/([a-z0-9])([A-Z])/, '\1-\2')
      .tr("_", "-")
      .gsub(/[^a-zA-Z0-9-]/, "-")
      .gsub(/-+/, "-")
      .downcase
  end

  def section_slug
    kebab_slug
  end

  def permalink
    @permalink.empty? ? "/projects/#{kebab_slug}/" : @permalink
  end

  def project_markdown_path
    File.join(root_path, "_projects", code_slug, "#{code_slug}.markdown")
  end

  def include_path
    File.join(root_path, "_includes", "projects", code_slug, "content.html")
  end

  def css_path
    File.join(root_path, "assets", "css", "projects", code_slug, "#{code_slug}.css")
  end

  def variables_css_path
    File.join(root_path, "assets", "css", "projects", code_slug, "variables.css")
  end

  def js_path
    File.join(root_path, "assets", "js", "projects", code_slug, "#{code_slug}.js")
  end

  def gallery_gitkeep_path
    File.join(root_path, "assets", "images", "projects", code_slug, "gallery_images", ".gitkeep")
  end

  def hero_gitkeep_path
    File.join(root_path, "assets", "images", "projects", code_slug, "hero", ".gitkeep")
  end

  def thumbnails_gitkeep_path
    File.join(root_path, "assets", "images", "projects", code_slug, "thumbnails", ".gitkeep")
  end

  def markdown_content
    lines = ["---"]

    lines << "layout: #{yaml_inline(merged_data.fetch("layout"))}"
    lines << "title: #{yaml_inline(merged_data.fetch("title"))}"
    lines << "project_mode: #{yaml_inline(merged_data.fetch("project_mode"))}"
    lines << "custom_include: #{yaml_inline(merged_data.fetch("custom_include"))}"
    lines << "project_date: #{yaml_inline(merged_data.fetch("project_date"))}"
    lines << "location: #{yaml_inline(merged_data.fetch("location"))}"
    append_list(lines, "keywords", merged_data.fetch("keywords"))
    lines << ""
    lines << "description: #{yaml_inline(merged_data.fetch("description"))}"
    lines << "permalink: #{yaml_inline(merged_data.fetch("permalink"))}"
    lines << ""

    append_list(lines, "stylesheets", merged_data["stylesheets"])
    lines << ""

    append_list(lines, "fonts", merged_data["fonts"]) if merged_data["fonts"]
    lines << "" if merged_data["fonts"]

    append_list(lines, "scripts", merged_data["scripts"])
    lines << ""

    lines << "hero_image: #{yaml_inline(merged_data["hero_image"])}"
    lines << ""
    lines << "gallery_path: #{yaml_inline(merged_data.fetch("gallery_path"))}"
    append_list(lines, "gallery_images", merged_data["gallery_images"]) if merged_data["gallery_images"]
    lines << "" if merged_data["gallery_images"]
    append_scalar(lines, "layout_data_key", merged_data["layout_data_key"])
    append_scalar(lines, "model_path", merged_data["model_path"])
    lines << "" if merged_data["layout_data_key"] || merged_data["model_path"]

    lines << "navSquareColour: #{yaml_inline(merged_data.fetch("navSquareColour"))}"
    lines << "navFontColour: #{yaml_inline(merged_data.fetch("navFontColour"))}"
    lines << ""

    append_list(lines, "thumbnails", merged_data.fetch("thumbnails"))
    lines << ""

    append_list(lines, "indexImage", merged_data.fetch("indexImage"))
    append_list(lines, "smallImages", merged_data["smallImages"]) if merged_data["smallImages"]
    append_list(lines, "mediumImages", merged_data["mediumImages"]) if merged_data["mediumImages"]
    append_list(lines, "largeImages", merged_data["largeImages"]) if merged_data["largeImages"]
    append_scalar(lines, "gallery_descriptions", merged_data["gallery_descriptions"]) if merged_data.key?("gallery_descriptions")
    append_scalar(lines, "gallery_articles", merged_data["gallery_articles"]) if merged_data.key?("gallery_articles")
    lines << "---"
    lines << ""
    lines.join("\n")
  end

  def include_content
    <<~HTML
      <section class="#{section_slug}-section">
          <div class="#{section_slug}-content"></div>
      </section>
    HTML
  end

  def css_content
    <<~CSS
      @import url("./variables.css");

      .#{section_slug}-section {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: var(--#{section_slug}-background);
          color: var(--#{section_slug}-foreground);
      }

      .#{section_slug}-content {
          width: min(1200px, calc(100% - 2rem));
          margin: 0 auto;
          padding: 6rem 0;
      }
    CSS
  end

  def variables_css_content
    <<~CSS
      :root {
          --#{section_slug}-background: #111111;
          --#{section_slug}-foreground: #f5f5f5;
      }
    CSS
  end

  def js_content
    <<~JS
      (() => {
          const section = document.querySelector(".#{section_slug}-section");
          if (!section) return;
      })();
    JS
  end

  def relative_to_root(path)
    path.delete_prefix("#{root_path}/")
  end

  def merged_data
    @merged_data ||= begin
      defaults = {
        "layout" => "projects/project",
        "title" => title,
        "project_mode" => "minimal",
        "custom_include" => "projects/#{code_slug}/content.html",
        "project_date" => Date.today.iso8601,
        "location" => "",
        "keywords" => [],
        "description" => description,
        "permalink" => permalink,
        "stylesheets" => ["/assets/css/projects/#{code_slug}/#{code_slug}.css"],
        "scripts" => ["/assets/js/projects/#{code_slug}/#{code_slug}.js"],
        "hero_image" => nil,
        "gallery_path" => "/assets/images/projects/#{code_slug}/gallery_images/",
        "navSquareColour" => "#000000",
        "navFontColour" => "#ffffff",
        "thumbnails" => ["/assets/images/projects/#{code_slug}/thumbnails/"],
        "indexImage" => [],
      }

      data = defaults.merge(existing_data.reject { |_, value| value.nil? || value == "" })

      if data["layout"] == "projects/#{code_slug}"
        data["layout"] = "projects/project"
      end

      data["custom_include"] = "projects/#{code_slug}/content.html" if data["custom_include"].to_s.strip.empty?
      data["project_mode"] = defaults["project_mode"] if data["project_mode"].to_s.strip.empty?
      data["project_date"] = defaults["project_date"] if data["project_date"].to_s.strip.empty?
      data["keywords"] = Array(data["keywords"])
      data
    end
  end

  def append_scalar(lines, key, value)
    return if value.nil?

    lines << "#{key}: #{yaml_inline(value)}"
  end

  def append_list(lines, key, values)
    return if values.nil?

    values = Array(values)
    if values.empty?
      lines << "#{key}: []"
      return
    end

    lines << "#{key}:"
    values.each do |value|
      lines << "  - #{yaml_inline(value)}"
    end
  end

  def yaml_inline(value)
    return "" if value.nil?
    return value.inspect if value.is_a?(String)
    return value.to_s if value == true || value == false || value.is_a?(Numeric)

    YAML.dump(value).sub(/\A---\s*\n/, "").strip
  end
end
