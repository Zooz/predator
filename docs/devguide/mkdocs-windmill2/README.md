[![PyPI][pypi-image]][pypi-link]

  [pypi-image]: https://img.shields.io/pypi/v/mkdocs-windmill.svg
  [pypi-link]: https://pypi.python.org/pypi/mkdocs-windmill

# Windmill theme for MkDocs
Outstanding mkdocs theme with a focus on navigation and usability, from Grist Labs.

Highlights:
- Convenient navigation for larger documentation projects.
- Retains state of the navigation menu across page transitions.
- Search with term highlighting.
- User may search in a quick dropdown or load results in a full page.
- Default mkdocs theme within pages, including syntax highlighting.

## Quick start

To install using `pip`:
``` sh
pip install mkdocs-windmill
```

To use in `mkdocs.yml`:
``` yaml
theme: windmill
```

Note that it's important for there to exist a homepage, e.g. a top-level root element in mkdocs 1.0+:
``` yaml
nav:
  - Home: index.md
```

## Demo and documentation

More details are on this site generated with the Windmill theme:
- [Usage](https://gristlabs.github.io/mkdocs-windmill/#) for more on installation and usage.
- [Customization](https://gristlabs.github.io/mkdocs-windmill/#customization/) for extra configuration options that Windmill supports.

## Development

If doing development on `mkdocs-windmill`, check it out with
``` sh
git clone https://github.com/gristlabs/mkdocs-windmill/
cd mkdocs-windmill
```

There are Selenium browser tests, based on NodeJS. To set them up, first [install Yarn](https://yarnpkg.com/en/docs/install), then from `mkdocs-windmill` checkout, run
``` sh
cd tests
yarn install
```

You can run tests when you make changes as follows:
``` sh
cd tests
MKDOCS_BINARY=<path-to-mkdocs-command> SELENIUM_BROWSER=chrome yarn test
```
