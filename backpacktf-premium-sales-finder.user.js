// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia
// @description Adds coloring to history pages indicating recent sales and includes compare links for sales
// @include     /^https?:\/\/(.*\.)?backpack\.tf(\:\d+)?\/item\/\d+/
// @include     /^https?:\/\/(.*\.)?backpack\.tf(\:\d+)?\/profiles\/\d{17}\/?$/
// @version     4.0.2
// @grant       none
// @run-at      document-end
// @updateURL   https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.meta.js
// @downloadURL https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.user.js
// ==/UserScript==

(function(){
    'use strict';
    
    // all of the code that runs when the page is loaded is here
    function ready() {
        [
            // item history pages
            {
                pattern: /^https?:\/\/(.*\.)?backpack\.tf(\:\d+)?\/item\/\d+/,
                fn: getHistory
            },
            // inventory pages
            {
                pattern: /^https?:\/\/(.*\.)?backpack\.tf\/profiles\/\d{17}\#\!\/compare\/\d{10}\/\d{10}\/nearest/,
                fn: getInventory
            }
        ].find((mode) => {
            // will call function when something matches, then stop
            return mode.pattern.test(location.href) && (mode.fn() || true);
        });
    }
    
    /**
     * Super basic omitEmpty function
     * @param {Object} obj - Object to omit values from
     * @returns {Object} Object with null, undefined, or empty string values omitted
     */
    function omitEmpty(obj) {
        // create clone so we do not modify original object
        let result = Object.assign({}, obj);
        
        for (let k in result) { 
            if (result[k] === null || result[k] === undefined || result[k] === '') {
                delete result[k];
            }
        }
        
        return result;
    }
    
    /**
     * Convert date to unix timestamp
     * @param {Object} date - Date object
     * @returns {Number} Unix timestamp
     */
    function toX(date) {
        return Math.round(date.getTime() / 1000);
    }
    
    // called on history pages
    function getHistory() {
        // jquery elements
        const PAGE = {
            $history: $('.history-sheet table.table'),
            $item: $('.item'),
            $panelExtras: $('.panel-extras'),
            $username: $('.username')
        };
        
        // add bot.tf listing snapshots link to page
        function addBotTFLink() {
            // only if an item exists on page
            if (PAGE.$item.length === 0) return;
            
            let data = PAGE.$item.data();
            let params = omitEmpty({
                def: data.defindex,
                q: data.quality,
                ef: data.effect_name,
                craft: data.craftable ? 1 : 0,
                aus: data.australium ? 1 : 0,
                ks: data.ks_tier || 0
            });
            let queryString = Object.keys(params).map((key) => {
                return `${key}=${encodeURIComponent(params[key])}`;
            }).join('&');
            let url = 'https://bot.tf/stats/listings?' + queryString;
            let $pullRight = PAGE.$panelExtras.find('.pull-right');
            let $btnGroup = $('<div class="btn-group"/>');
            let $link = $(`<a class="btn btn-panel" href="${url}"><i class="fa fa-search"></i> Bot.tf</a>`);
            
            if ($pullRight.length === 0) {
                $pullRight = $('<div class="pull-right"/>');
                PAGE.$panelExtras.append($pullRight);
            }
            
            $btnGroup.append($link);
            $pullRight.prepend($btnGroup);
        }
        
        // add contents to the page
        function addTableLinks() {
            /**
             * Get columns from history table
             * @returns {Object} Object containing details for each column e.g. { 'ID': { index: 0, $header: $column } }
             */
            function getColumns() {
                let columns = {}; // column elements
                
                PAGE.$history.find('thead tr th').each((index, el) => {
                    let $column = $(el);
                    let text = $column.text().trim();
                    
                    // assign column based on column heading text
                    columns[text] = {
                        // add index so we know the order of each column
                        index: $column.index(), 
                        $header: $column
                    };
                });
                
                return columns;
            }
            
            /**
             * Get a value from a URL according to pattern
             * @param {String} url - URL
             * @param {Object} pattern - Pattern to match. The 1st match group should be the value we are trying to get
             * @returns {(String|null)} Matched value, or null if the pattern does not match
             */
            function getValueFromURL(url, pattern) {
                let match = (url || '').match(pattern);
                
                return match && match[1];
            }
            
            /**
             * Add contents for a row
             * @param {Number} index - Index of row
             * @param {Object} el - DOM element of row
             * @returns {undefined}
             */
            function addRowContents(index, el) {
                // add links for row
                function addLinks() {
                    let itemname = PAGE.$item.attr('data-name');
                    let addSteamLink = sessionSteamId &&
                        // do not show if current owner, unless there is no item name (moved elsewhere)
                        // logged in user and steamid of row must match
                        ((prevSteamId || !itemname) && (sessionSteamId == userSteamId)) ||
                        // if previous row steamid is the same as logged in user
                        (sessionSteamId == prevSteamId);
                    
                    addLink.column(
                        getURL.compare(prevSteamId, lastSeenDate),
                        'Compare',
                        'Buyer',
                        'User'
                    );
                    addLink.column(
                        getURL.compare(userSteamId, lastSeenDate),
                        'Compare',
                        'Seller',
                        'User'
                    );
                    
                    // add steam link if all conditions are met
                    if (addSteamLink) {
                        addLink.inline(
                            getURL.inventoryHistory(lastSeenDate),
                            '<i class="stm stm-steam"/>',
                            'User'
                        );
                    }
                }
                
                // adds highlighting to row
                function addHighlighting() {
                    let days = dayDifference(lastSeenDate, new Date());
                    
                    // add coloring depending on how long ago the hat was last sold
                    if (days <= 60) {
                        $row.addClass('success');
                    } else if (days <= 90) {
                        $row.addClass('warning');
                    } else if (days <= 120) {
                        $row.addClass('danger');
                    }
                }
                
                /**
                 * Get rows for each column by column name
                 * @param {Object} $row = jQuery object for row
                 * @returns {Object} Row columns mapped by column e.g. { 'ID': $td, 'User': $td }
                 */
                function getRowColumns($row) {
                    let $tds = $row.find('td');
                    let rowColumns = {};
                    
                    for (let name in columns) {
                        rowColumns[name] = $tds.eq(columns[name].index);
                    }
                    
                    return rowColumns;
                }
                
                /**
                 * Get date when item was last seen in user's inventory
                 * @returns {Object} Date object
                 */
                function getLastSeenDate() {
                    let href = rowColumns['Last seen'].find('a').attr('href');
                    let timestamp = getValueFromURL(href, /time=(\d+)$/);
                    
                    return timestamp && new Date(parseInt(timestamp) * 1000);
                }
                
                /**
                 * Get difference in days between two dates
                 * @param {Object} date1 - First date
                 * @param {Object} date2 - Second date
                 * @returns {Number} Difference
                 */
                function dayDifference(date1, date2) {
                    let oneDay = 24 * 60 * 60 * 1000;
                    let difference = Math.abs(date1.getTime() - date2.getTime());
                    
                    return Math.round(difference / oneDay);
                }
                
                let addLink = (function () {
                    /**
                     * Creates a jQuery link
                     * @param {String} href - URL
                     * @param {String} contents - HTML contents of link
                     * @returns {Object} jQuery object of link
                     */
                    function getLink(href, contents) {
                        return $('<a/>').html(contents).attr({
                            'href': href,
                            'target': '_blank'
                        });
                    }
                    
                    /**
                     * Adds a link to "User" column
                     * @param {String} href - URL
                     * @param {String} contents - HTML contents of link
                     * @param {String} appendTo - Name of column to append to e.g. "User"
                     * @returns {undefined}
                     */
                    function inline(href, contents, appendTo) {
                        let $link = getLink(href, contents);
                        let $span = $('<span/>').css({
                            'float': 'right',
                            'margin-left': '0.6em'
                        }).append($link);
                        
                        rowColumns[appendTo].append($span);
                    }
                    
                    /**
                     * Adds a link as a new column, after "User" column
                     * @param {String} href - URL
                     * @param {String} contents - HTML contents of link
                     * @param {String} columnName - Name of column
                     * @param {String} insertAfter - Name of column to insert after e.g. "User"
                     * @returns {undefined}
                     */
                    function column(href, contents, columnName, insertAfter) {
                        function addHeader() {
                            let $th = $('<th/>').text(columnName);
                            
                            $th.insertAfter(columns[insertAfter].$header);
                            // keep track of column by indexing using column name
                            columns[columnName] = {
                                $header: $th
                            };
                        }
                        
                        let $link = getLink(href, contents);
                        // the first row does not include a link
                        let $td = $('<td/>').append(index === 0 ? '--------' : $link);
                        
                        $td.insertAfter(rowColumns[insertAfter]);
                        
                        // this will ensure that a heading cell is added only once for each column added
                        if (!columns[columnName]) {
                            addHeader();
                        }
                    }
                    
                    return { inline, column };
                }());
                let getURL = (function () {
                    /**
                     * Get URL of your steam history at date
                     * @param {Object} date - Date of history point
                     * @returns {String} Inventory history URL
                     */
                    function inventoryHistory(date) {
                        let itemname = PAGE.$item.attr('data-name');
                        // for adding a filter with history bastard -
                        // https://naknak.net/tf2/historybastard/historybastard.user.js
                        let filter = itemname ? '#filter-' + itemname : '';
                        
                        return [
                            'http://steamcommunity.com/my/inventoryhistory/',
                            '?after_time=' + toX(date),
                            '&prev=1',
                            filter 
                        ].join('');
                    }
                    
                    /**
                     * Get URL of compare link on backpack.tf
                     * @param {String} steamid - SteamID of user
                     * @param {Object} date - Date of history point
                     * @returns {String} Inventory comparison URL
                     */
                    function compare(steamid, date) {
                        // set date to beginning of day
                        date.setUTCHours(0); 
                        date.setUTCMinutes(0);
                        date.setUTCSeconds(0);
                        date.setUTCMilliseconds(0);
                        
                        let x = toX(date);
                        
                        return [
                            'https://backpack.tf/profiles/' +
                            steamid,
                            '#!',
                            '/compare/',
                            x,
                            '/',
                            x,
                            // add "/nearest" so that we can treat this compare link in a special manner
                            // 'getInventory' will be called when this link is loaded
                            '/nearest' 
                        ].join('');
                    }
                    
                    return { inventoryHistory, compare };
                }());
                let $row = $(el);
                let rowColumns = getRowColumns($row);
                let lastSeenDate = getLastSeenDate();
                let userSteamId = rowColumns['User'].find('.user-handle a').attr('data-id');
                
                addHighlighting();
                addLinks();
                
                // set prev steamid to current now that we are done with this row
                prevSteamId = userSteamId;
            }
            
            let columns = getColumns();
            let href = PAGE.$username.find('a').attr('href');
            let sessionSteamId = getValueFromURL(href, /\/profiles\/(\d{17})$/); // current logged in user
            let prevSteamId;
            
            PAGE.$history.find('tbody tr').each(addRowContents); // iterate to add links for each row
        }
        
        return (function() {
            addBotTFLink();
            addTableLinks();
        })();
    }
    
    // called on inventory pages
    function getInventory() {
        // jquery elements
        const PAGE = {
            $snapshots: $('#historicalview option')
        };
        const SNAPSHOTS = PAGE.$snapshots.map((i, el) => {
            return parseInt(el.value);
        }).get().filter(a => a);
        
        /**
         * Get closet snapshot time according to timestamp
         * @param {Number} timestamp - Unix timestamp
         * @param {Boolean} [before] - Whether the closest snapshot should appear before 'timestamp'
         * @param {Number} [other] - Snapshot must not be the same as this value
         * @returns {(Number|null)} Closest snapshot to date
         */
        function getClosestSnapshot(timestamp, before, other) {
            const asc = (a, b) => (b - a); // sort ascending
            const desc = (a, b) => (a - b); // sort descending
            
            // loop until we find the first result that is at or before the timestamp if "before" is set to true
            // when "before" is set, array is sorted in descending order, or ascending if not set
            return SNAPSHOTS.sort(before ? desc : asc).find((snapshot) => {
                let isBefore = timestamp <= snapshot;
                let isAfter = timestamp >= snapshot;
                let isOther = snapshot === other;
                
                return (
                    before ? isBefore : isAfter
                ) && !isOther; // snapshot must also not be the same as "other"
            }) || (before ? Math.min : Math.max)(...SNAPSHOTS);
            // default value is first or last snapshot if one did not meet conditions
            // will probably only default to this if the time is closest to the first or last snapshot
            // or with one-snapshot inventories 
        }
        
        // update the location so that each timestamp is at the closest time according to recorded inventory snapshots
        function changeLocation() {
            let pattern = /(\d{10})\/(\d{10})\/nearest$/;
            // should always match
            let timestamps = location.href.match(pattern).slice(1).map(a => parseInt(a)); 
            // must be at or before the first date
            let from = getClosestSnapshot(timestamps[0], true); 
            // must be at or before the second date, and not the same date as 'from'
            let to = getClosestSnapshot(timestamps[1], false, from); 
            
            // finally update location.href using new timestamps
            location.href = location.href.replace(pattern, [from, to].join('/'));
        }
        
        return (function() {
            changeLocation();
        })();
    }
    
    ready();
})();
