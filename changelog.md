## [Unreleased] - 2024-08-05

### Added
- Added partition boxplots.
- Added attribute boxplots
- An extended version of LRNet with two parameters.
- An option to nulify similarity matrix while converting data to network. 
This action sets all values that are lower than similarity matrix geometric mean to 0.
- Histograms to node attributes to better see their distribution and their values.
- Matthew's correlation coeficient and bar plots showing dominant real classes in clusters.
- Histograms now show the distribution of selected nodes.

### Fixed
- Project can be saved again to json
- Filter are now working properly
- Graph tooltips are now positioned correctly
- Fixed the LRNet algorithm which was constructing the network incorrectly.
- Fixed the Louvain algorithm. Now the correct number of communities is found. 

### Changed

- Change the way the graph is stored at client side. Lowered memory consumption.
- The color settings and other visual settings were moved to its own tab to better 
separate graph visual and layout settings.
- Moved node attribute sizing to visual settings.
- Lowered the height and unified the number of bins of histograms.
- Changed the form structure for dataset loading for better clarity.

### Removed

- Unused normalize.css file.
- Identical links assigned in each translation file.
- Duplicate index file for the english version.

[unreleased]: https://github.com/Anim64/MultiVariateNetworkExplorer/releases/tag/v0.1.2

