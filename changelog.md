- Trademark sign previously shown after the project description in version 
0.3.0



## [Unreleased] - 2024-08-05

### Added
- Added partition boxplots.
- An extended version of LRNet with two parameters.
- An option to nulify similarity matrix while converting data to network. 
This action sets all values that are lower than similarity matrix geometric mean to 0.
- Histograms to node attributes to better see their distribution and their values.
- Matthew's correlation coeficient and bar plots showing dominant real classes in clusters.

### Fixed
- Project can be saved again to json
- Filter are now working properly

### Changed

- Change the way the graph is stored at client side. Lowered memory consumption.
- The color settings and other visual settings were moved to its own tab to better 
separate graph visual and layout settings.
- Moved node attribute sizing to visual settings

### Removed

- Unused normalize.css file.
- Identical links assigned in each translation file.
- Duplicate index file for the english version.

[unreleased]: https://github.com/Anim64/MultiVariateNetworkExplorer/releases/tag/v0.1.2

