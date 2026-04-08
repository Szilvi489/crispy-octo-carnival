# crispy-octo-carnival

## Overview

This repository contains my personal portfolio website, built as a frontend practice project and as a place to present my photography and CV in one cohesive experience.

The goal of the project is not only to publish content, but also to experiment with layout systems, animation, interaction design, data-driven rendering, and custom page concepts. It is a space where I can deliberately practice frontend development, try new ideas, and build something that reflects both my technical work and my visual interests.

In short, this project is meant to show future employers:

- how I structure a real frontend project
- how I work with reusable layouts and modular page sections
- how I build custom interactions with vanilla JavaScript
- how I combine design, content, and code into a portfolio website

## What The Site Contains

The website is organized as a portfolio with multiple distinct areas:

- a homepage that introduces the portfolio through a visual grid of project images
- a photo collections page that lists the photography projects
- individual project pages with their own layout and interaction logic
- an about page
- a contact page
- a dedicated CV area

The portfolio combines two purposes:

1. practicing frontend skills and learning new techniques
2. showcasing photography, personal presentation, and professional background

## Main Technologies

This project is mainly built with:

- Jekyll as the static site generator
- Liquid templates for layouts, includes, and data-driven rendering
- HTML5 for structure
- CSS for page styling, visual identity, layout systems, and animations
- vanilla JavaScript for interaction logic
- Ruby and Bundler for the Jekyll development workflow
- RubyGems plugins such as `jekyll-feed` and `jekyll-last-modified-at`
- Ruby utility scripts under `scripts/` for gallery scaffolding and other developer tooling
- PHP for the protected CV entry flow
- YAML data files for project metadata, page content, and reusable structured content

External libraries and services used in the project include:

- GSAP and ScrollTrigger for animation and scroll-based effects
- Three.js and `GLTFLoader` for the 3D model on the Cambodia project page
- Font Awesome for icons
- Google Fonts for typography
- `flag-icons` for country flag styling on the mountains project

There is also a small Node.js utility script used to generate the "image of the day" data file.

## Architecture And Project Structure

The project is built as a custom Jekyll site instead of using a ready-made theme.

### Content structure

- `_layouts/` contains the main page layouts
- `_includes/` contains reusable page sections and partials
- `_projects/` stores the photo collection entries as a Jekyll collection
- `_data/` contains YAML data used to drive page content and gallery layouts
- `assets/` contains the shared CSS, JavaScript, images, and fonts
- `CV/` contains the protected CV area and its dedicated assets

### Rendering approach

The site uses Jekyll collections and Liquid loops to generate content dynamically. Instead of hardcoding every image directly into the markup, several pages build their UI from:

- collection entries in `_projects/`
- static file lookups
- YAML layout files in `_data/`
- JSON blobs embedded into templates and consumed by client-side JavaScript

This makes the site easier to extend and turns content into structured data rather than one-off markup.

### Project mode switch

Photography project entries in `_projects/` now support a front matter level mode switch:

- `project_mode: minimal` uses the shared minimalist horizontal gallery shell
- `project_mode: under_construction` uses the shared placeholder state
- `project_mode: custom` renders the project-specific include referenced by `custom_include`

Each project entry also carries shared metadata fields such as `project_date`, `location`, and `keywords`, so the base shell can render consistent corner details without custom page logic.

## Site Sections

### 1. Home page

The homepage is designed as a visual landing page built from project images.

It pulls `indexImage` entries from the `projects` collection and renders them into a responsive image grid. The JavaScript then enhances the page with:

- automatic grid row sizing based on image aspect ratios
- randomized visual size classes
- an infinite recycling gallery effect
- a custom cursor treatment on hover

This page is meant to feel alive and image-driven, not like a standard static portfolio homepage.

### 2. Projects overview page

The projects page displays all photography collections in one place. It is generated from the Jekyll `projects` collection and uses thumbnails defined per project.

Frontend behavior on this page includes:

- a custom loading state with progress counter
- dynamic tile sizing based on available row width
- hover-based background preview changes
- lazy-loaded thumbnail rendering

### 3. Photography project pages

Each photo collection has its own layout, styling, and interaction model.

#### Bangkok Night

This page uses a horizontally scrolling visual composition built from images in the gallery directory plus a YAML layout definition.

Techniques used:

- data-driven image placement from `_data/bangkokNightLayout.yml`
- layered parallax behavior
- horizontal wheel-to-scroll interaction
- deterministic sizing and layering logic
- floating typographic elements integrated into the image track

#### Cambodia Street

This page mixes editorial text, photography, animation, and 3D.

Techniques used:

- gallery data injected from Jekyll into JSON
- staged entrance animations with GSAP
- scroll-based motion for text elements
- Three.js scene setup with a GLB model
- responsive WebGL rendering
- a hybrid composition of static photography and interactive 3D content

#### Mountains

This is one of the most technically ambitious sections in the project.

It combines photography, metadata, place-based storytelling, and interaction design. The project uses front matter and supporting data to drive a slideshow/article experience.

Techniques used:

- scroll-driven slideshow state updates
- thumbnail synchronization and active-state logic
- wheel-based gallery navigation
- an image "binocular" zoom interaction
- article metadata attached to individual images
- structured geographic information such as title, coordinates, timezone, and map image

#### Forest

This section exists as part of the overall project structure and image set, and serves as another area for experimentation and further frontend development.

### 4. About page

The about page includes a stop-motion-style portrait interaction.

Techniques used:

- layered image sequence playback on hover and focus
- keyboard-accessible interaction
- live time display rendered with `Intl.DateTimeFormat`

### 5. Contact page

The contact page is designed as an animated editorial-style interface instead of a standard form layout.

Techniques used:

- GSAP-powered entrance animation
- animated background gradients
- typewriter-like staged text reveal
- progressive reveal of form controls
- custom visual composition with moving decorative elements

### 6. CV section

The CV is built as its own modular experience with separate styles, scripts, partials, and structured content.

It includes sections such as:

- intro
- education
- experience
- skills
- programming projects
- personal section
- dream job section

Notable implementation details:

- the CV page is split into reusable include files
- text and labels are pulled from `_data/i18n/cv/en.yml`
- the skills section is generated from data and rendered as an interactive weighted tile layout
- the CV has its own animated page loader and section-specific behavior
- the CV navigation includes animated smooth-scrolling and hover effects

## Frontend Techniques Practiced In This Project

This repository is especially useful as a record of the techniques I am practicing and improving.

These include:

- custom page architecture with Jekyll layouts and includes
- modular CSS organization by page and component
- page-specific art direction instead of one generic design system
- DOM-driven interactions in vanilla JavaScript
- scroll-based animation and progressive reveal patterns
- responsive gallery behavior
- data-driven rendering with YAML and Liquid
- dynamic JSON handoff from server-rendered templates to browser-side scripts
- asset organization for large image-based pages
- accessibility-minded interaction patterns such as focus handling and ARIA attributes

## CV Protection Note

The CV area is intentionally not fully public.

Visitors encounter it as a password-protected frontend entry point, and the access flow is implemented with a dedicated login page. In deployment, access is enforced by a lightweight PHP session-based gate under `CV/`.

This allows the main portfolio and photography work to remain public while the CV can be shared more selectively.

## Development Workflow

### Local development

Install dependencies:

```bash
bundle install
npm install
```

Run the Jekyll site locally:

```bash
bundle exec jekyll serve
```

### Decap CMS

A first Decap CMS setup now exists under `/admin/`.

The CMS now includes:

- collection configuration in `admin/config.yml`
- a local watcher script that scaffolds the gallery shell for new photo projects
- a Ruby scaffold script for creating the same gallery shell directly from the terminal

For the local learning flow and backend notes, see:

- `docs/decap-cms.md`

### Utility script

Generate a random "image of the day" entry:

```bash
node scripts/choose-image-of-the-day.js
```

This updates `_data/imageOfTheDay.yml`.

Generate a new photo project scaffold:

```bash
ruby scripts/scaffold_photo_project.rb --slug myGallery --title "My Gallery"
```

This creates the starter markdown, layout, include, CSS, JS, and image folder structure for a new photo gallery.

Watch for new CMS-created photo projects and scaffold the rest automatically:

```bash
npm run cms:watch-projects
```

The watcher derives the project layout path and support files from the CMS entry slug, so the admin UI no longer needs a layout picker.

## Deployment Notes

The main site is generated as a Jekyll build, but the protected CV area requires PHP support in deployment.

That means:

- the portfolio itself is mostly static-site oriented
- the CV login flow is deployed as a small PHP-backed protected section

Detailed deployment notes already exist in:

- `CV/DEPLOYMENT.md`

## What This Project Demonstrates

This project demonstrates:

- frontend experimentation beyond basic template usage
- custom interaction design with JavaScript
- the ability to organize a multi-page portfolio codebase
- combining static site generation with a small protected dynamic area
- using code to support both presentation and storytelling

It is also an ongoing project. Some content areas still contain placeholder text or are being refined, but the structure, interaction ideas, and technical direction already show the kind of frontend work I want to keep developing.
