VERSION=`python setup.py --version`

default:
	@echo "Specify one of: serve, publish_docs, publish_package"

serve:
	env/bin/mkdocs serve -a localhost:8000

publish_docs:
	env/bin/mkdocs gh-deploy

publish_package:
	@echo Build python distribution
	python setup.py sdist bdist_wheel
	@echo "Publish to PyPI at https://pypi.python.org/pypi/mkdocs-windmill"
	@echo "Version in setup.py is $(VERSION)"
	@echo "Git tag is `git describe --tags`"
	@echo "Run this manually: python3 -m twine upload dist/mkdocs-windmill-$(VERSION).tar.gz dist/mkdocs_windmill-$(VERSION)-py2-none-any.whl"


.PHONY: serve publish_docs publish_package
