# backpack.tf Premium Recent Sales Finder

Modified due to being included as an official feature. Only runs on item history pages, and not on Premium search results.

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
* 1.2.1 - August 26th, 2015
   * Cleaned up code.
   * Added auto-updater.
* 1.2.2 - August 26th, 2015
   * Fixed problem in click handler.
* 2.0 - February 5th, 2016
   * Updated to work with new version of backpack.tf.
   * Added highlighters to item histories.
   * Added quick-links to user's Outpost trades in item histories.
* 2.1 & 2.2 - February 15th, 2016
   * Updated to work with new version of backpack.tf.
* 2.3 (Done by The Oddball)
   * Updated to work with new version of backpack.tf.
   * Made script much faster.
* 2.4 (Done by The Oddball)
   * Updated to work with new version of backpack.tf.
* 2.5 - April 30th, 2017
   * Removed features for premium search results.
* 3.0 - July 25th, 2017
   * Modified format of Javascript.
   * Removed "Outpost Trades" column and replaced with a button link.
   * Added links to Steam inventory at inventory time for items with logged in user in history.

## Overview

Adds color indicating recent sales on history pages. Adds a link to each user's outpost page with given ID's in history passed as URL parameters. Adds a link to the Steam inventory at inventory time in backpack.tf history for the logged in user.