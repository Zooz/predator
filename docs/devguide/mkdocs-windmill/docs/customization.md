# Customization


For details about standard mkdocs options, see [MkDocs Configuration](http://www.mkdocs.org/user-guide/configuration/).

In addition, the Windmill theme supports a few additional options, which may be
listed under the `extra:` key of `mkdocs.yml`.

## Extra configuration options

`extra.logo`: Path to a logo to include in the top bar next to the site name.

`extra.version`: Version number to include right under the site name.

`extra.article_nav_top`: Set to `false` to hide the Previous/Next navigation buttons above article contents.

`extra.article_nav_bottom`: Set to `false` to hide the Previous/Next navigation buttons below article contents.

`extra.history_buttons`: Include back/forward buttons in the top bar. This is
  useful when the documentation site is included into a bare browser, e.g. into
  an Electron-based application.
