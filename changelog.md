- Trademark sign previously shown after the project description in version 
0.3.0

## [1.1.1] - 2023-03-05

### Added

- An extended version of LRNet with two parameters.
- An option to nulify similarity matrix while converting data to network. 
This action sets all values that are lower than similarity matrix geometric mean to 0.
- Hiistograms to node attributes to better see their distribution and their values.
- Matthew's correlation coeficient and bar plots showing dominant real classes in clusters.

### Fixed

### Changed

- Change the way the graph is stored at client side. Improved memory consumption.
- The color settings and other visual settings were moved to its own tab to better 
separate graph visual and layout settings.

### Removed

- Unused normalize.css file.
- Identical links assigned in each translation file.
- Duplicate index file for the english version.

[unreleased]: https://github.com/olivierlacan/keep-a-changelog/compare/v0.1.2...HEAD

