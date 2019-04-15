# Windmill theme

## About

Windmill theme focuses on clean usable navigation for large documentation
projects. It retains the state of the menu of pages and folders across page
transitions, by keeping navigation to an iframe.

It also implements a versatile search, featuring term highlighting, and both a
quick dropdown and a full-page option that allows the user to come back to
search results.

Within pages, it uses the default mkdocs theme, including syntax highlighting.

## Installation

Install the Windmill theme using `pip`:

``` sh
pip install mkdocs-windmill
```

To install and get started with `mkdocs`, follow [MkDocs documentation](http://www.mkdocs.org/#installation).

## Usage

To use the Windmill theme installed via `pip`, add this to your `mkdocs.yml`:

``` yaml
theme: 'windmill'
```

If you cloned Windmill from GitHub:

``` yaml
theme:
  name: null
  custom_dir: '{INSTALL_DIR}/mkdocs_windmill'
  # Copy settings from mkdocs_theme.yml, which is ignored by custom_dir themes.
  static_templates: [404.html]
  search_index_only: true
  include_search_page: true
```

Note that it's important for there to exist a homepage, e.g. a top-level root element in mkdocs 1.0+:
``` yaml
nav:
  - Home: index.md
```

See [Customization](customization.md) for a few extra configuration options
supported by the Windmill theme.
