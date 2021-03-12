# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.5.1] - 2021-03-12

Removed:

- removed option to choose where to open links, because it was more confusing than beneficial


## [v1.5.0] - 2021-03-12

Added:

- added sessions sorting


## [v1.4.2] - 2021-03-12

Fixed:

- fixed bug where sidebar would leave padding when switching to multiflow mode


## [v1.4.1] - 2021-03-12

Fixed:

- fixed bug where multiflow didn't work on workflowy subdomains 


## [v1.4.0] - 2021-02-15

Added:

- extension now activates immediately on loading; no need to use the toolbar button
- can now switch in and out of workflowy / multiflow modes by simply closing or opening panels
- user can now save, load and remove multiple sessions


## [v1.3.0] - 2021-02-12

User interface:

- completely new form-based UI
- added Vue JS

Functionality:

- added settings for where links open
- added manual session save / load

Internal:

- major refactor of internal code
- added compilation / build pipeline


## [v1.2.1] - 2021-02-08

Changes:

- fixed loading bug
- improved build script


## [v1.2.0] - 2021-02-08

Various improvements:

- sync panel UI with current layout
- improve and reduce frequency of save routine
- add JS Doc comments
- clarify popup code
- move popup CSS to external file
- minor bug fixes


## [v1.1.0] - 2021-02-03

Fixed:

- css style which prevented workflowy.com from scrolling
- bug with bullets and links

Assets:

- added readme
- updated icons
- added sketch file


## [v0.1.0] - 2021-02-02

Initial release:

- runs after user clicks on toolbar button
- allows clicking on bullets and links to open new frames
- graphical ui to change layout
- caches frames as they load


[Unreleased]: https://github.com/davestewart/workflowy-multiflow/compare/v1.5.1...HEAD
[v1.5.1]: https://github.com/davestewart/workflowy-multiflow/compare/v1.5.0...v1.5.1
[v1.5.0]: https://github.com/davestewart/workflowy-multiflow/compare/v1.4.2...v1.5.0
[v1.4.2]: https://github.com/davestewart/workflowy-multiflow/compare/v1.4.1...v1.4.2
[v1.4.1]: https://github.com/davestewart/workflowy-multiflow/compare/v1.4.0...v1.4.1
[v1.4.0]: https://github.com/davestewart/workflowy-multiflow/compare/v1.3.0...v1.4.0
[v1.3.0]: https://github.com/davestewart/workflowy-multiflow/compare/v1.2.0...v1.3.0
[v1.2.0]: https://github.com/davestewart/workflowy-multiflow/compare/v1.1.0...v1.2.0
[v1.1.0]: https://github.com/davestewart/workflowy-multiflow/compare/v0.1.0...v1.1.0
[v0.1.0]: https://github.com/davestewart/workflowy-multiflow/releases/tag/v0.1.0
