# Changelog

All notable [changes](https://github.com/davestewart/workflowy-multiflow/tags) to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v3.0.1] - 2024-06-19

Fixed:

- Fixed handling of "Open links in desktop app" by moving from content to popup

## [v3.0.0] - 2024-06-18

Changed:

- Major upgrade to Chrome Manifest V3

Added:

- Can now save single and multi-page sessions
- Can now edit saved session titles
- New interface

## [v2.1.0] - 2023-09-19

Added:

- Added click handling for any breadcrumb or left navigation item

## [v2.0.4] - 2023-09-19

Fixed:

- Fix intermittent missing borders on Vivaldi

Changed:

- Change method to check desktop link settings

## [v2.0.3] - 2023-09-18

Changed:

- Checks settings to prompt to disable desktop app links on every load

## [v2.0.2] - 2023-09-18

Fixed:

- Fixed bug with search node not opening when launching MultiFlow mode
- Fix bug with WorkFlowy reloading when closing panes and final pane is `/`

Changed:

- Moved install-check function to helper
- On install, checks settings before prompting to disable desktop app links
- Added prompt to pin extension icon

## [v2.0.1] - 2023-09-17

Fixed:

- Moved install-check setting to background process

## [v2.0.0] - 2023-09-17

Changed:

- Changed MultiFlow initialisation to prevent nesting WorkFlowy nodes

Added:

- Installation now opens WorkFlowy project page

Fixed:

- Fixed styling causing full-width layout issues

## [v1.6.3] - 2023-09-17

Added:

- Added desktop links warning 

## [v1.6.2] - 2023-09-14

Fixed:

- Fix bug with `App` constructor returning promise not `app` instance

## [v1.6.1] - 2023-02-21

Fixed:

- Fixed bug with empty space at top of page in workflowy beta 

## [v1.6.0] - 2023-01-21

Added:

- Added extension interoperability API 

## [v1.5.1] - 2021-03-12

Removed:

- Removed option to choose where to open links, because it was more confusing than beneficial


## [v1.5.0] - 2021-03-12

Added:

- Added sessions sorting


## [v1.4.2] - 2021-03-12

Fixed:

- Fixed bug where sidebar would leave padding when switching to multiflow mode


## [v1.4.1] - 2021-03-12

Fixed:

- Fixed bug where multiflow didn't work on workflowy subdomains 


## [v1.4.0] - 2021-02-15

Added:

- Extension now activates immediately on loading; no need to use the toolbar button
- Can now switch in and out of workflowy / multiflow modes by simply closing or opening panels
- User can now save, load and remove multiple sessions


## [v1.3.0] - 2021-02-12

User interface:

- Completely new form-based UI
- Added Vue JS

Functionality:

- Added settings for where links open
- Added manual session save / load

Internal:

- Major refactor of internal code
- Added compilation / build pipeline


## [v1.2.1] - 2021-02-08

Changes:

- Fixed loading bug
- Improved build script


## [v1.2.0] - 2021-02-08

Various improvements:

- Sync panel UI with current layout
- Improve and reduce frequency of save routine
- Add JS Doc comments
- Clarify popup code
- Move popup CSS to external file
- Minor bug fixes


## [v1.1.0] - 2021-02-03

Fixed:

- CSS style which prevented workflowy.com from scrolling
- Bug with bullets and links

Assets:

- Added readme
- Updated icons
- Added sketch file


## [v0.1.0] - 2021-02-02

Initial release:

- Runs after user clicks on toolbar button
- Allows clicking on bullets and links to open new frames
- Graphical ui to change layout
- Caches frames as they load
