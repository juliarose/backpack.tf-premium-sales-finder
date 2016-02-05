// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia
// @description Find recent sales for those hats :3
// @include     /https?:\/\/backpack\.tf\/premium\/search.*/
// @include     /https?:\/\/backpack\.tf\/item\/.*/
// @version     2.0
// @grant       none
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
var historytableidentifier = '.history-sheet table';
var collection = {};
var location = window.location.href;

premiumRecentSalesReady = function() {
    var $checkSales = $('<a class="btn btn-info btn-block btn-sm" id="build-search" title="Advanced">Check exchanges</a>');
    var $everything = $('.everything-form .btn-premium').after($checkSales);
    
    $('.results:first .result').each(function() {
        var $this = $(this);
        var $item = $this.find('.item-singular .item');
        var id = $item.data('original-id');
        var isOriginal = false;
        var $btn;
        
        if (isOriginal) {
            // it's in the original state, so it does not need to be checked
            $btn = $('<a href="javascript:void(0)" class="btn btn-danger btn-xs">None</a>')
        } else {
            $btn = $('<a href="javascript:void(0)" class="btn btn-default btn-xs check-sale"><i class="fa fa-question"></i> Last Exchanged</a>');
            $btn.click(btnClicked);
        }
        
        $this.find('.buttons.btn-group').append($btn);
    });
    
    $checkSales.click(function() {
        $(this).addClass('disabled').unbind('click');
        
        checkSales();
    });
}

outpostHistoryReady = function() {
    var $tr = $(historytableidentifier + ' tr'),
        $tds, usersteamid, itemid;
  
    addColumn('trades');
    locateRows($('body'));
    $tr.each(function() {
        var $this = $(this);
        
        $tds = $this.find('td');
        itemid = $tds.eq(cols['id']).text().trim();
        usersteamid = $tds.eq(cols['owner']).find('.user-handle-container a').attr('data-id');
        
        if (itemid && usersteamid) {
            if (collection[usersteamid]) {
                collection[usersteamid].push(itemid);
            } else {
                collection[usersteamid] = [itemid]; // new array
            }
        }
    });
    
    $tr.each(function() {
        historyLink($(this));
    });
}

addColumn = function(name) {
    var $tr = $(historytableidentifier + ' tr'),
        $lastCol = $tr.first().find('th').last(),
        $col = $('<th/>').text(colsHeads[name]).insertAfter($lastCol); // add heading
    
    cols[name] = $col.index();
    
    $tr.each(function() {
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
        usersteamid = $usercol.find('.user-handle-container a').attr('data-id'),
        userHref = [outpostURL, 'user', usersteamid].join('/') + '?itemid=' + collection[usersteamid].join(','),
        $userOPLink = $('<a></a>').text('View trades')
          .attr({ 'href': userHref,
                  'target': '_blank' });
    
    var days = dayDifference(lastseendate, now);
    
    if (days <= 60) {
        $row.addClass('success');
    } else if (days <= 90) {
        $row.addClass('warning');
    }
    
    $tradescol.append($userOPLink);
}

checkSales = function() {
    var n = 0, gap = 300;
    
    $('.check-sale').each(function() {
        var $this = $(this);
        
        setTimeout(function() {
            $this.trigger('click');
        }, n);
        
        n += gap;
    });
}

btnClicked = function() {
    var $btn = $(this),
        $item = $btn.closest('.result').find('.item-singular .item'),
        id = $item.data('original-id');
    
    if (id) ajax(id, $btn);
}

ajax = function(id, $btn) {
    $.ajax({
        type: 'GET',
        dataType: 'html',
        url: itemURL(id),
        success: function (response) {
            var doc = document.implementation.createHTMLDocument('item'); doc.documentElement.innerHTML = response;
            var data = $(doc).find('#page-content');
            
            checkHistory(data, $btn);
        }, error: function (xhr, ajaxOptions, thrownError) {
            // page failed to load
        }
    });
}

checkHistory = function(data, $btn) {
    $btn.removeClass('btn-default').unbind('click');
    
    var $history = $(data), previousOwner, now = new Date(),
        hasSales, days, $duped = $history.find('.alert.alert-warning'),
        duped = $duped.length && $duped.text().indexOf('duplicate') > -1;
    
    locateRows($history);
    
    $history.find(historytableidentifier + ' tr').each(function() {
        var $this = $(this);
        var $tds = $this.find('td');
        
        if ($tds.length) {
            var $lastseen = $tds.eq(cols['lastseen']),
                $owner = $tds.eq(cols['owner']),
                owner = $owner.find('.user-handle-container a').data('id'), // steamid of owner
                lastseendate, hasSales = previousOwner && previousOwner != owner;
            
            if (hasSales) {
                lastseendate = new Date($lastseen.text());
                days = dayDifference(lastseendate, now);
            }
            
            previousOwner = owner;
        } 
        
        return !hasSales;
    });
    
    var labelClass = 'btn-danger';
    var text = 'None';
    
    if (isNumber(days)) {
        if (days > 0) {
            text = days + ' ' + (days === 1 ? 'day' : 'days') + ' ago';
        } else {
            text = 'Today';
        }
        
        if (days <= 60) {
            labelClass = 'btn-success';
        } else if (days <= 90) {
            labelClass = 'btn-warning';
        }
    }
    
    if (duped) {
        $btn.clone().text('Duped').addClass('btn-warning').insertAfter($btn);
    }
    
    $btn.text(text).addClass(labelClass);
}

locateRows = function($data) {
    $data.find(historytableidentifier + ' tr th').each(function() {
        for (var k in colsHeads) {
            if (colsHeads[k].toLowerCase() === $(this).text().toLowerCase()) {
                cols[k] = $(this).index();
            }
        }
    });
}

isNumber = function(n) {
    return !isNaN(n);
}

dayDifference = function(d1, d2) {
    var oneDay = 24*60*60*1000;

    return Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)))
}

itemURL = function(id) {
    return window.location.protocol + '//' + window.location.hostname + '/item/' + id;
}

$(document).ready(function() {
    // premium
    if (location.match(/https?:\/\/backpack\.tf\/premium\/search.*/)) {
        premiumRecentSalesReady();
    } else {
        outpostHistoryReady();
    }
});