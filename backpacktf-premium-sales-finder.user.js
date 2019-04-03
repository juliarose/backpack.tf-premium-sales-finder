// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia
// @description Adds coloring to history pages indicating recent sales and direct link to user's outpost page
// @include     /^https?:\/\/(.*\.)?backpack\.tf(\:\d+)?\/item\/.*/
// @version     3.7.1
// @grant       none
// @run-at      document-end
// @updateURL   https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.meta.js
// @downloadURL https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.user.js
// ==/UserScript==

(function(){
    'use strict';
    
    // jquery elements
    let page = {
        $history: $('.history-sheet table.table'),
        $item: $('.item'),
        $panelExtras: $('.panel-extras')
    };
    
    function onReady() {
        addBotTFLink();
        addTableLinks();
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
     * @returns {Number} Unix timetamp
     */
    function toX(date) {
        return Math.round(date.getTime() / 1000);
    }
    
    // add bot.tf listing snapshots link to page
    function addBotTFLink() {
        // item must be visible
        if (page.$item.length === 0) return;
        
        let data = page.$item.data();
        let params = omitEmpty({
            def: data.defindex,
            q: data.quality,
            ef: data.effect_name,
            craft: data.craftable ? 1 : 0,
            aus: data.australium ? 1 : 0,
            ks: data.ks_tier || 0
        });
        let queryString = Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&');
        let url = 'https://bot.tf/stats/listings?' + queryString;
        let $pullRight = page.$panelExtras.find('.pull-right');
        let $btnGroup = $('<div class="btn-group"/>');
        let $link = $(`<a class="btn btn-panel" href="${url}"><i class="fa fa-search"></i> Bot.tf</a>`);
        
        if ($pullRight.length === 0) {
            $pullRight = $('<div class="pull-right"/>');
            page.$panelExtras.append($pullRight);
        }
        
        $btnGroup.append($link);
        $pullRight.prepend($btnGroup);
    }
    
    // add contents to the page
    function addTableLinks() {
        /**
         * Get columns from history table
         * @returns {Object} An object containing details for each column labeled by header text e.g. { 'ID': { index: 0, $header: $column } }
         */
        function getColumns() {
            let columns = {}; // column elements
            
            page.$history.find('thead tr th').each((index, el) => {
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
         * Add contents for a row
         * @param {Number} index - Index of row
         * @param {Object} el - DOM element of row
         * @returns {undefined}
         */
        function addRowContents(index, el) {
            /** Get rows for each column by column name
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
             * Get difference in days between two dates
             * @param {Object} date1 - First date
             * @param {Object} date2 - Second date
             * @returns {Number} Difference
             */
            function dayDifference(date1, date2) {
                return Math.round(Math.abs((date1.getTime() - date2.getTime()) / (24 * 60 * 60 * 1000)));
            }
            
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
            
            let addLink = {
                /**
                 * Adds a link to "User" column
                 * @param {String} href - URL
                 * @param {String} contents - HTML contents of link
                 * @param {String} column - Name of column to append to e.g. "User"
                 * @returns {undefined}
                 */
                inline: (href, contents, appendTo) => {
                    let $link = getLink(href, contents);
                    let $span = $('<span/>').css({
                        'float': 'right',
                        'margin-left': '0.6em'
                    }).append($link);
                    
                    rowColumns[appendTo].append($span);
                },
                /**
                 * Adds a link as a new column, after "User" column
                 * @param {String} href - URL
                 * @param {String} contents - HTML contents of link
                 * @param {String} columnName - Name of column
                 * @param {String} insertAfter - Name of column to insert after e.g. "User"
                 * @returns {undefined}
                 */
                column: (href, contents, columnName, insertAfter) => {
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
                    let $td = $('<td/>').append(index === 0 ? '—————' : $link);
                    
                    $td.insertAfter(rowColumns[insertAfter]);
                    
                    // this will ensure that a heading cell is added only once for each column added
                    if (!columns[columnName]) {
                        addHeader();
                    }
                }
            };
            let getURL = {
                /**
                 * Get URL of your steam history at date
                 * @param {Object} date - Date of history point
                 * @returns {String} Inventory history URL
                 */
                inventoryHistory: (date) => {
                    return [
                        'http://steamcommunity.com/my/inventoryhistory/?after_time=',
                        toX(date),
                        '&prev=1',
                        // for adding a filter with history bastard - https://naknak.net/tf2/historybastard/historybastard.user.js
                        (itemname ? '#filter-' + itemname : '') 
                    ].join('');
                },
                /**
                 * Get URL of compare link on backpack.tf
                 * @param {String} steamid - SteamID of user
                 * @param {Object} date - Date of history point
                 * @returns {String} Inventory comparison URL
                 */
                compare: (steamid, date) => {
                    let date1 = new Date(date);
                    let date2;
                    
                    // set hours, minutes, seconds, and ms to 0
                    date1.setUTCHours(0); 
                    date1.setUTCMinutes(0);
                    date1.setUTCSeconds(0);
                    date1.setUTCMilliseconds(0);
                    date1.setDate(date1.getDate() + -1); // add offset
                    
                    date2 = new Date(date1);
                    date2.setDate(date2.getDate() + 1); // add 1 day
                    
                    return [
                        'https://backpack.tf/profiles/' +
                        steamid,
                        '#!',
                        '/compare/',
                        toX(date1),
                        '/',
                        toX(date2)
                    ].join('');
                }
            };
            let $row = $(el);
            let rowColumns = getRowColumns($row);
            let lastSeenDateUrl = rowColumns['Last seen'].find('a').attr('href');
            let match = lastSeenDateUrl.match(/time=(\d+)$/);
            let lastseendate = match && new Date(parseInt(match[1]) * 1000);
            let usersteamid = rowColumns['User'].find('.user-handle a').attr('data-id');
            let days = dayDifference(lastseendate, new Date());
            let addSteamLink = Session && Session.steamid &&
                // do not show if current owner, unless there is no item name (moved to elsewhere)
                // logged in user and steamid of row must match
                ((prevsteamid || !itemname) && Session.steamid == usersteamid) ||
                // if previous row steamid is different than logged in user
                (Session.steamid == prevsteamid);
            
            addLink.column(getURL.compare(usersteamid, lastseendate), 'Compare', 'Seller', 'User');
            addLink.column(getURL.compare(prevsteamid, lastseendate), 'Compare', 'Buyer', 'User');
            
            // add steam link if all conditions are met
            if (addSteamLink) {
                addLink.inline(getURL.inventoryHistory(lastseendate), '<i class="stm stm-steam"/>', 'User');
            }
            
            // add coloring depending on how long ago the hat was last sold
            if (days <= 60) {
                $row.addClass('success');
            } else if (days <= 90) {
                $row.addClass('warning');
            } else if (days <= 120) {
                $row.addClass('danger');
            }
            
            // set prev steamid
            prevsteamid = usersteamid;
        }
        
        let columns = getColumns(); // get columns by heading text
        let itemname = page.$item.attr('data-name'); // assign item name
        let prevsteamid;
        
        page.$history.find('tbody tr').each(addRowContents); // iterate to add links for each row
    }

    onReady();
})();
