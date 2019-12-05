// @include /^https?:\/\/(.*\.)?backpack\.tf(:\d+)?\/item\/\d+/
function({$, omitEmpty, dayDifference}) {
    // jquery elements
    const PAGE = {
        $history: $('.history-sheet table.table'),
        $item: $('.item'),
        $panelExtras: $('.panel-extras'),
        $username: $('.username')
    };
    
    // add contents to the page
    (function addTableLinks() {
        /**
         * Get a value from a URL according to pattern.
         * @param {String} url - URL.
         * @param {Object} pattern - Pattern to match. The 1st match group should be the value we are trying to get.
         * @returns {(String|null)} Matched value, or null if the pattern does not match.
         */
        function getValueFromURL(url, pattern) {
            const match = (url || '').match(pattern);
            
            return (
                match &&
                match[1]
            );
        }
        
        /**
         * Add contents for a row.
         * @param {Object} options - Options.
         * @param {Object} options.table - Object containing details of table.
         * @param {Number} options.$item - JQuery element for item.
         * @param {Number} options.index - Index of row.
         * @param {Object} options.$row - JQuery object of row.
         * @param {String} [options.loggedInUserSteamId] - The steamid of the currently logged in user.
         * @param {String} [options.prevSteamId] - The steamid of the previous row.
         * @returns {undefined}
         */
        function addRowContents({table, $item, index, $row, loggedInUserSteamId, prevSteamId}) {
            // contains methods for adding links
            const addLink = (function () {
                /**
                 * Creates a jQuery link.
                 * @param {String} href - URL.
                 * @param {String} contents - HTML contents of link.
                 * @returns {Object} JQuery object of link.
                 */
                function getLink({href, contents}) {
                    const $link = $('<a/>').html(contents).attr({
                        'href': href,
                        'target': '_blank'
                    });
                    
                    return $link;
                }
                
                return {
                    inline({href, contents, $cell}) {
                        const $link = getLink({href, contents});
                        const $span = $('<span/>').css({
                            'float': 'right',
                            'margin-left': '0.6em'
                        }).append($link);
                        
                        $cell.append($span);
                    },
                    column({href, contents, excludeLink, $cell}) {
                        // the first row does not include a link
                        const html = excludeLink ? '--------' : getLink({href, contents});
                        
                        $cell.html(html);
                    }
                };
            }());
            // contains methods for getting urls
            const getURL = {
                /**
                 * Get URL of your steam history at date.
                 * @param {Object} $item - JQuery object of item.
                 * @param {Object} date - Date of history point.
                 * @returns {String} Inventory history URL.
                 */
                inventoryHistory($item, date) {
                    const itemname = $item.attr('data-name');
                    // for adding a filter with history bastard -
                    // https://naknak.net/tf2/historybastard/historybastard.user.js
                    const filter = itemname ? '#filter-' + itemname : '';
                    
                    return [
                        'http://steamcommunity.com/my/inventoryhistory/',
                        // unix timestamp
                        '?after_time=' + Math.round(date.getTime() / 1000),
                        '&prev=1',
                        filter 
                    ].join('');
                },
                /**
                 * Get URL of compare link on backpack.tf.
                 * @param {String} steamid - SteamID of user.
                 * @param {Object} date - Date of history point.
                 * @returns {String} Inventory comparison URL.
                 */
                compare(steamid, date) {
                    // set date to beginning of day
                    date.setUTCHours(0); 
                    date.setUTCMinutes(0);
                    date.setUTCSeconds(0);
                    date.setUTCMilliseconds(0);
                    
                    // unix timestamp
                    const x = Math.round(date.getTime() / 1000);
                    
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
            };
            // get an object of the columns for this row by each column name e.g. "User"
            const rowColumns = Object.entries(table).reduce((prev, [name, column]) => {
                // get nth cell in column cells
                prev[name] = column.$cells.eq(index);
                
                return prev;
            }, {});
            // get href from last seen
            const href = rowColumns['Last seen'].find('a').attr('href');
            // to extract its timmestamp value
            const timestampValue = getValueFromURL(href, /time=(\d+)$/);
            // then convert that value into a date
            // it is the date when the item was last seen
            const lastSeenDate = new Date(parseInt(timestampValue) * 1000);
            // get the steamid of the user from the row
            const userSteamId = rowColumns['User'].find('.user-handle a').attr('data-id');
            // add links for row
            const itemname = $item.attr('data-name');
            // adds highlighting to row
            const days = dayDifference(lastSeenDate, new Date());
            
            // add coloring depending on how long ago the hat was last sold
            if (days <= 60) {
                $row.addClass('success');
            } else if (days <= 90) {
                $row.addClass('warning');
            } else if (days <= 120) {
                $row.addClass('danger');
            }
            
            // links to be added to the row
            const links = {
                column: [
                    // compare link for seller->buyer
                    {
                        href: getURL.compare(userSteamId, lastSeenDate),
                        contents: 'Compare',
                        // do not include the link if the index is 0
                        excludeLink: index === 0,
                        // add the link to the buyer cell
                        $cell: rowColumns.Seller
                    },
                    // compare link for buyer->seller
                    {
                        href: getURL.compare(prevSteamId, lastSeenDate),
                        contents: 'Compare',
                        // do not include the link if the index is 0
                        excludeLink: index === 0,
                        // add the link to the seller cell
                        $cell: rowColumns.Buyer
                    }
                ],
                inline: []
            };
            
            const addSteamLink = Boolean(
                loggedInUserSteamId &&
                // do not show if current owner, unless there is no item name (moved elsewhere)
                // logged in user and steamid of row must match
                ((prevSteamId || !itemname) && (loggedInUserSteamId == userSteamId)) ||
                // if previous row steamid is the same as logged in user
                (loggedInUserSteamId == prevSteamId)
            );
            
            // add steam link if all conditions are met
            if (addSteamLink) {
                links.inline.push({
                    href: getURL.inventoryHistory($item, lastSeenDate),
                    contents: '<i class="stm stm-steam"/>',
                    // add the link to the user cell
                    $cell: rowColumns.User
                });
            }
            
            // add the links
            Object.entries(links).forEach(([name, links]) => {
                links.forEach(addLink[name]);
            });
            
            // set prev steamid to current now that we are done with this row
            return userSteamId;
        }
        
        const {$history, $item, $username} = PAGE;
        const $rows = $history.find('tbody > tr');
        const columnDefinitions = [
            {
                columnName: 'Seller',
                after: 'User'
            },
            {
                columnName: 'Buyer',
                after: 'User'
            }
        ];
        // creates a new column (and adds the header after the previous column)
        const defineColumn = ($rows, columnName, prevColumn) => {
            // get the index and header from the previous column
            const {index, $header, $cells} = prevColumn;
            const $prevTds = $cells;
            // increment from previous
            const columnIndex = index + 1;
            const $th = $('<th/>').text(columnName);
            // a blank td
            const $td = $('<td/>').html(columnName);
            
            // add the header
            $th.insertAfter($header);
            // add the td after each previous td
            $td.insertAfter($prevTds);
            
            const $columnCells = $rows.find(`> td:nth-child(${columnIndex + 1})`);
            
            return {
                index: columnIndex,
                $header: $th,
                $cells: $columnCells
            };
        };
        let columnsAdded = 0;
        // construct a table
        const table = $history
            // all table headers in table head
            .find('thead tr th')
            // get the data for each column
            .map((index, el) => {
                const $header = $(el);
                const name = $header.text().trim();
                const $cells = $rows.find(`> td:nth-child(${index + 1})`);
                
                return {
                    name,
                    // add index so we know the order of each column
                    index,
                    $header,
                    $cells
                };
            })
            // get raw array value from jQuery map
            .get()
            // then reduce into object where the key is the column's name
            .reduce((prev, column) => {
                const {name, index, $header, $cells} = column;
                
                // assign column based on column heading text
                prev[name] = {
                    index: index + columnsAdded,
                    $header,
                    $cells
                };
                
                const columnsToAdd = columnDefinitions.filter(({after}) => {
                    return after === name;
                });
                let prevColumn = prev[name];
                
                columnsAdded += columnsToAdd.length;
                columnsToAdd.forEach(({columnName}) =>{
                    prev[columnName] = defineColumn($rows, columnName, prevColumn);
                    prevColumn = prev[columnName];
                });
                
                return prev;
            }, {});
        // throw 'no';
        // get the href from the element containing details of the logged in user
        const loggedInUserHref = $username.find('a').attr('href');
        // current logged in user
        const loggedInUserSteamId = getValueFromURL(loggedInUserHref, /\/profiles\/(\d{17})$/);
        let prevSteamId;
        
        // iterate to add links for each row
        $rows.each((index, el) => {
            const $row = $(el);
            
            // function will return the steamid of the row
            // which can then be passed to the next iteration
            prevSteamId = addRowContents({
                table,
                $item,
                index,
                $row,
                loggedInUserSteamId,
                prevSteamId
            });
        });
    }());
    // add buttons to the page
    (function addButtons() {
        /**
         * Adds a button link to the page.
         * @param {Object} options - Options.
         * @param {String} options.name - Link text.
         * @param {String} options.url - URL of link.
         * @param {String} [options.icon='fa-search'] - The icon for the link.
         * @param {Object} $container - JQuery object for container.
         * @returns {undefined}
         */
        function addButton($container, {name, url, icon}) {
            let $pullRight = $container.find('.pull-right');
            const $btnGroup = $('<div class="btn-group"/>');
            const $link = $(`<a class="btn btn-panel" href="${url}"><i class="fa ${icon || 'fa-search'}"></i> ${name}</a>`);
            
            if ($pullRight.length === 0) {
                // add a pull-right element if one does not already exist
                // so that we can left align this on the right of the panel
                $pullRight = $('<div class="pull-right"/>');
                $container.append($pullRight);
            }
            
            $btnGroup.append($link);
            $pullRight.prepend($btnGroup);
        }
        
        const urlGenerators = {
            // get details for bot.tf listing snapshots link to page
            botTF($item) {
                const data = $item.data();
                const params = omitEmpty({
                    def: data.defindex,
                    q: data.quality,
                    ef: data.effect_name,
                    craft: data.craftable ? 1 : 0,
                    aus: data.australium ? 1 : 0,
                    ks: data.ks_tier || 0
                });
                const queryString = Object.keys(params).map((key) => {
                    return `${key}=${encodeURIComponent(params[key])}`;
                }).join('&');
                const url = 'https://bot.tf/stats/listings?' + queryString;
                
                return url;
            },
            // add marketplace link to page
            marketplaceTF($item) {
                const data = $item.data();
                const $itemIcon = $item.find('.item-icon');
                // get the war paint id from the background image
                const backgroundImage = $itemIcon.css('background-image');
                // matches the url for a war paint image
                const reWarPaintPattern = /https:\/\/scrap\.tf\/img\/items\/warpaint\/(?:(?![×Þß÷þø_])[%\-'0-9a-zÀ-ÿA-z])+_(\d+)_(\d+)_(\d+)\.png/i;
                const warPaintMatch = backgroundImage.match(reWarPaintPattern);
                // will be in first group
                const warPaintId = warPaintMatch ? warPaintMatch[1] : null;
                // get the id of the wear using the name of the wear
                const wearId = {
                    'Factory New': 1,
                    'Minimal Wear': 2,
                    'Field-Tested': 3,
                    'Well-Worn': 4,
                    'Battle Scarred': 5
                }[data.wear_tier];
                const params = [
                    data.defindex,
                    data.quality,
                    data.effect_id ? 'u' + data.effect_id : null,
                    wearId ? 'w' + wearId : null,
                    warPaintId ? 'pk' + warPaintId : null,
                    data.ks_tier ? 'kt-' + data.ks_tier : null,
                    data.australium ? 'australium' : null,
                    !data.craftable ? 'uncraftable' : null,
                    // is a strange version
                    data.quality_elevated == '11' ? 'strange' : null
                ].filter(param => param !== null);
                const url = 'https://marketplace.tf/items/tf2/' + params.join(';');
                
                return url;
            }
        };
        
        // only if an item exists on page
        if (PAGE.$item.length > 0) {
            const $item = PAGE.$item;
            const $container = PAGE.$panelExtras;
            const generators = {
                'Bot.tf': urlGenerators.botTF,
                'Marketplace.tf': urlGenerators.marketplaceTF
            };
            
            Object.entries(generators).forEach(([name, generator]) => {
                // generate the button details using the generator
                const url = generator($item);
                
                // add it to the given container
                addButton($container, {
                    name,
                    url
                });
            });
        }
    }());
}