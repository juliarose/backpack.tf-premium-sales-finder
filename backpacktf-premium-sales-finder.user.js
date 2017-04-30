// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia & The Oddball
// @description Adds coloring to history pages indicating recent sales and direct link to user's outpost page
// @include     /https?:\/\/backpack\.tf\/item\/.*/
// @version     2.5
// @grant       none
// @run-at      document-end
// @updateURL   https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.meta.js
// @downloadURL https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.user.js
// ==/UserScript==

var outpostURL = 'http://www.tf2outpost.com';
var colsHeads = {
    'owner': 'User',
    'lastseen': 'Last seen',
    'id': 'ID',
    'trades': 'Outpost User'
};
var cols = {};
var historytableidentifier = '.history-sheet table.table';
var collection = {};
var location = window.location.href;

outpostHistoryReady = function () {
    var $tr = $(historytableidentifier + ' tr'),
        $tds, usersteamid, itemid;

    addColumn('trades');
    locateRows($('body'));
    $tr.each(function () {
        var $this = $(this);

        $tds = $this.find('td');
        itemid = $tds.eq(cols['id']).text().trim();
        usersteamid = $tds.eq(cols['owner']).find('.user-handle a').attr('data-id');

        if (itemid && usersteamid) {
            if (collection[usersteamid]) {
                collection[usersteamid].push(itemid);
            } else {
                collection[usersteamid] = [itemid]; // new array
            }
        }
    });

    $tr.each(function () {
        historyLink($(this));
    });
}

addColumn = function (name) {
    var $tr = $(historytableidentifier + ' tr'),
        $lastCol = $tr.first().find('th').last(),
        $col = $('<th/>').text(colsHeads[name]).insertAfter($lastCol); // add heading

    cols[name] = $col.index();

    $tr.each(function () {
        var $this = $(this);
        var $td = $this.find('td');

        // add a column
        if ($td.length) {
            $this.append('<td/>');
        }
    })
}

function historyLink($row) {
    if ($row.find('th').length) return; // return if is a heading

    var now = new Date(),
        $tds = $row.find('td'),
        $usercol = $tds.eq(cols['owner']),
        $idcol = $tds.eq(cols['id']),
        $lastseen = $tds.eq(cols['lastseen']),
        $tradescol = $tds.eq(cols['trades']),
        itemid = $idcol.text().trim(),
        lastseendate = new Date($lastseen.text());
    itemHref = [outpostURL, 'item', '440,' + itemid].join('/'),
    usersteamid = $usercol.find('.user-handle a').attr('data-id'),
    userHref = [outpostURL, 'user', usersteamid].join('/') + '?itemid=' + collection[usersteamid].join(','),
    $userOPLink = $('<a></a>').text('View trades')
      .attr({
          'href': userHref,
          'target': '_blank'
      });

    var days = dayDifference(lastseendate, now);

    if (days <= 60) {
        $row.addClass('success');
    } else if (days <= 90) {
        $row.addClass('warning');
    }

    $tradescol.append($userOPLink);
}

locateRows = function ($data) {
    $data.find(historytableidentifier + ' tr th').each(function () {
        for (var k in colsHeads) {
            if (colsHeads[k].toLowerCase() === $(this).text().toLowerCase()) {
                cols[k] = $(this).index();
            }
        }
    });
}

dayDifference = function (d1, d2) {
    var oneDay = 24 * 60 * 60 * 1000;

    return Math.round(Math.abs((d1.getTime() - d2.getTime()) / (oneDay)))
}

itemURL = function (id) {
    return window.location.protocol + '//' + window.location.hostname + '/item/' + id;
}

outpostHistoryReady();