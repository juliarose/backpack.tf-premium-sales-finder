// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia
// @description Adds coloring to history pages indicating recent sales and direct link to user's outpost page
// @include     /^https?:\/\/(.*\.)?backpack\.tf(\:\d+)?\/item\/.*/
// @version     3.5
// @grant       none
// @run-at      document-end
// @updateURL   https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.meta.js
// @downloadURL https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.user.js
// ==/UserScript==

(function(){
    'use strict';

    var colsHeads = {
        'owner': 'User',
        'lastseen': 'Last seen',
        'id': 'ID'
    };
    var $headerCols = {};
    var $cols = {}; // column elements
    var collection = {}; // collect id's for each steamid
    var $historytable = $('.history-sheet table.table');
    // general relevant item info
    var itemname;
    var isDuped;
    // used with iteration
    var prevsteamid;

    function onReady() {
        var $tr = $historytable.find('tbody tr');
        var $headertr = $historytable.find('thead tr th');

        function getColPos(index, el) {
            var $this = $(el);
            var text = $this.text().toLowerCase();

            for (var k in colsHeads) {
                if (colsHeads[k].toLowerCase() === text) {
                    $cols[k] = $this.index();
                    $headerCols[k] = $this;
                }
            }
        }

        isDuped = $('#dupe-modal-btn').length > 0;
        itemname = $('.item').attr('data-name'); // assign item name

        $headertr.each(getColPos); // get position of each column
        $tr.each(getID); // iterate to collect id's
        $tr.each(historyLink); // iterate to add links for each row
    }

    // fill collection with id's for each steamid
    function getID(index, el) {
        var $this = $(el);
        var $tds = $this.find('td');
        var itemid = $tds.eq($cols.id).text().trim();
        var usersteamid = $tds.eq($cols.owner).find('.user-handle a').attr('data-id');

        if (itemid && usersteamid) {
            (collection[usersteamid] = collection[usersteamid] || []).push(itemid); // push id
        }
    }

    function historyLink(index, el) {
        function getColumns($row) {
            var $tds = $row.find('td');
            var $rowColumns = {};

            for (var k in $cols) {
                $rowColumns[k] = $tds.eq($cols[k]);
            }

            return $rowColumns;
        }

        function dayDifference(d1, d2) {
            return Math.round(Math.abs((d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000)));
        }

        function addLink(href, contents, columnName) {
            var $link = '';

            if (href) {
                 $link = $('<a/>')
                    .html(contents)
                    .attr({
                        'href': href,
                        'target': '_blank'
                    });
            }

            if (columnName) {
                var $td = $('<td/>').append($link || '---------------');

                $td.insertAfter($columns.owner);

                // this is sloppy, but this will ensure that a heading cell is added only once for each column added
                if (!$headerCols[columnName]) {
                    var $th = $('<th/>').text(columnName);

                    $th.insertAfter($headerCols.owner);
                    // keep track of column by indexing using column name
                    $headerCols[columnName] = $th;
                }
            } else {
                var $span = $('<span/>')
                    .css({
                        'float': 'right',
                        'margin-left': '0.6em'
                    })
                    .append($link);

                $columns.owner.append($span);
            }
        }

        function inventoryHistoryURL(steamid, date) {
            return [
                'http://steamcommunity.com/profiles/',
                steamid,
                '/inventoryhistory/?after_time=',
                (date.getTime() / 1000),
                '&prev=1',
                ((itemname && '#filter-' + itemname) || '') // for adding a filter with history bastard - https://naknak.net/tf2/historybastard/historybastard.user.js
            ].join('');
        }

        function compareURL(steamid, date) {
            var hours = date.getUTCHours();
            var date1 = new Date(date);
            var date2;

            date1.setUTCHours(0);
            date1.setUTCMinutes(0);
            date1.setUTCSeconds(0);
            date1.setUTCMilliseconds(0);
            date1.setDate(date1.getDate() + -1); // add offset

            date2 = new Date(date1);
            date2.setDate(date2.getDate() + 1); // add 1 day

            function toX(date) {
                return Math.round(date.getTime() / 1000);
            }

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

        var $row = $(el);
        var $columns = getColumns($row);
        var lastSeenDateUrl = $columns.lastseen.find('a').attr('href');
        var match = lastSeenDateUrl.match(/time=(\d+)$/);
        var lastseendate = match && new Date(parseInt(match[1]) * 1000);
        var usersteamid = $columns.owner.find('.user-handle a').attr('data-id');
        var days = dayDifference(lastseendate, new Date());
        var addSteamLink = Session && Session.steamid &&
            // do not show if current owner, unless there is no item name (moved to elsewhere)
            // logged in user and steamid of row must match
            ((prevsteamid || !itemname) && Session.steamid == usersteamid) ||
            // if previous row steamid is different than logged in user
            (Session.steamid == prevsteamid) ||
            // duped items will have links on each row
            (isDuped && collection[Session.steamid]);

        addLink(prevsteamid && lastseendate && compareURL(prevsteamid, lastseendate), 'Compare', 'Buyer');
        addLink(prevsteamid && lastseendate && compareURL(usersteamid, lastseendate), 'Compare', 'Seller');
        addLink(addSteamLink && inventoryHistoryURL(Session.steamid, lastseendate), '<i class="stm stm-steam"/>');

        if (days <= 60) {
            $row.addClass('success');
        } else if (days <= 120) {
            $row.addClass('warning');
        }

        prevsteamid = usersteamid;
    }

    onReady();
})();
