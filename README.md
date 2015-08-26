# backpack.tf Premium Recent Sales Finder

Used for quickly scanning items to find recent sales.

## Requirements
* [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) (Chrome)
* [Greasemonkey](https://addons.mozilla.org/en-us/firefox/addon/greasemonkey/) (Firefox)

## Installation
1. Ensure that you have either Tampermonkey or Greasemonkey installed.
2. Download the script [`backpacktf-premium-sales-finder.user.js`](backpacktf-premium-sales-finder.user.js?raw=true).
3. Confirm that you want to install the script.
4. The script should now be installed and ready to use.

## Updates
* 1.0.0 - May 4th, 2015 - Initial Release
* 1.1.0 - Jun 15, 2015
   * Changed "Sales" to "Exchanges".
   * Added gifted symbol.
* 1.2.0 - August 25th, 2015
   * Updated to adapt newer look.
   * Items in original state are now displayed as "none" on load.
   * Premium pages with no results appear as they normally would.
* 1.2.0 - August 26th, 2015
   * Cleaned up code.
   * Added auto-updater.

## Overview

![premium](/images/premium-purple-energy-trophy-belt.png?raw=true)

Scanning for recent exchanges must be done manually. You can either click the "Check" label to check an item individually, or use the "Check exchanges for each item" shortcut in the upper right corner.

Green indicates the exchange occurred in the last 60 days (very recent). Yellow indiciates between 60 and 90 days (recent). Red indicates the last exchange occurred more than 90 days ago or the item has never been exchanged.

Occasionally an asterisk (*) will appear beside the number of days. This means the item is duplicated. Additionally, the number of days may be not accurate. Check with caution.

If a degree symbol appears (°) this means the item is gifted.