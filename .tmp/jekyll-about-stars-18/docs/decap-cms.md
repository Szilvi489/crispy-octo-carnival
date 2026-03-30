# Decap CMS Setup Notes

This project now includes a first Decap CMS integration under `/admin/`.

It is intentionally set up in two layers:

1. local editing that works right away
2. production authentication that you can add once you are happy with the local flow

## What was added

- `admin/index.html`
- `admin/config.yml`
- `scripts/scaffold_photo_project.rb`
- `scripts/watch_photo_project_scaffold.rb`
- `package.json` scripts for the local Decap proxy and Jekyll dev server

## Why the backend is `git-gateway`

The site is currently deployed to alwaysdata, not Netlify.

Decap CMS still needs a Git-aware backend for login and saving content. For local learning, the official Decap recommendation is:

- `backend.name: git-gateway`
- `local_backend: true`
- run `npx decap-server`

That gives you a working local CMS on `localhost` without setting up production auth first.

## How to run it locally

Install Node dependencies once:

```bash
npm install
```

Start the Decap local proxy in one terminal:

```bash
npm run cms:proxy
```

Start the Jekyll site in a second terminal:

```bash
npm run serve:site
```

Start the local project scaffold watcher in a third terminal if you want new CMS-created photo projects to generate their support files automatically:

```bash
npm run cms:watch-projects
```

Then open:

```text
http://127.0.0.1:4000/admin/
```

## What you can edit right now

### 1. Photo Projects

This is a folder collection backed by `_projects/`.

It teaches the most important Decap folder collection concepts:

- one collection controls many files with the same shape
- fields map directly to Jekyll front matter
- images can be selected through image widgets
- new entries are created with a path template

### 2. Downloadable CV Markdown

This is a file collection backed by `CV/download/cv-download.md`.

It teaches the file collection pattern:

- one explicit file path
- a fixed set of fields
- editing markdown body content through the CMS UI

## Slug-driven project scaffolding

The CMS no longer asks you to choose a project layout.

Instead:

- Decap creates `_projects/<slug>/<slug>.markdown`
- `scripts/watch_photo_project_scaffold.rb` notices the new file locally
- the scaffold logic derives the rest of the gallery shell from that same slug

That means the watcher creates:

- `_layouts/projects/<slug>.html`
- `_includes/projects/<slug>/content.html`
- `assets/css/projects/<slug>/<slug>.css`
- `assets/css/projects/<slug>/variables.css`
- `assets/js/projects/<slug>/<slug>.js`
- the `gallery_images`, `hero`, and `thumbnails` folders under `assets/images/projects/<slug>/`

It also patches the new markdown entry with deterministic front matter such as:

- `layout: projects/<slug>`
- stylesheet and script paths for that slug
- the default gallery and thumbnail folder paths

## Local project scaffolding

The watcher is local developer tooling, not a Decap feature or a Jekyll plugin.

You have two ways to use the same scaffold logic:

- `scripts/scaffold_photo_project.rb` creates a full gallery scaffold from the terminal
- `scripts/watch_photo_project_scaffold.rb` watches for new CMS-created project markdown files and creates the missing layout, include, CSS, JS, and image folders around them

## Why the giant YAML files are not in the first pass

Files like `_data/i18n/cv/en.yml` and `_data/programmingProjects.yml` are possible to model in Decap CMS, but they are not ideal as a first learning step because:

- they are large
- they are deeply nested
- partial file modeling can accidentally overwrite unrelated keys

The better next refactor is to split those files into smaller, more focused data files before exposing them in the CMS.

## Production options

### Easiest path

Use Netlify only for authentication, even if the final site stays deployed on alwaysdata.

That means:

1. connect this GitHub repo to a Netlify site
2. enable Netlify Identity
3. enable Git Gateway
4. keep the current `backend: git-gateway` config
5. point your live `/admin/` page at that auth flow

Only add the Netlify Identity widget to `admin/index.html` once that production auth flow actually exists.

If you load the widget before configuring a real Netlify site, Decap shows a local "What is your Netlify site URL?" prompt, which is confusing during local development and not needed for the local backend.

### Alternative path

Switch the Decap backend to `github` and run your own OAuth/auth proxy.

This gives you more control, but it is more setup work than the Netlify Identity route.

## Good next steps

1. Try the local admin flow and make one safe change in `CV/download/cv-download.md`.
2. Decide whether you want production auth through Netlify Identity or a custom GitHub OAuth flow.
3. Split `_data/i18n/cv/en.yml` into smaller files so Decap can manage CV sections cleanly.
4. Convert `_data/programmingProjects.yml` into a more editor-friendly structure or separate it into smaller data files.
5. Add media handling rules for new uploaded images once you know where you want Decap-managed assets to live long term.
