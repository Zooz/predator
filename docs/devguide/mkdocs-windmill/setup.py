from setuptools import setup, find_packages

VERSION = '0.1.8'

setup(
    name="mkdocs-windmill",
    version=VERSION,
    url='https://github.com/gristlabs/mkdocs-windmill',
    license='MIT',
    description='MkDocs theme focused on navigation and usability',
    author='Dmitry S',
    author_email='dmitry@getgrist.com',
    packages=find_packages(),
    include_package_data=True,
    entry_points={
        'mkdocs.themes': [
            'windmill = mkdocs_windmill',
        ]
    },
    zip_safe=False
)
