// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia
// @description Find recent sales for those hats :3
// @include     /https?:\/\/backpack\.tf\/premium\/search.*/
// @version     1.2.2
// @grant       none
// @updateURL   https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.meta.js
// @downloadURL https://github.com/juliarose/backpack.tf-premium-sales-finder/raw/master/backpacktf-premium-sales-finder.user.js
// ==/UserScript==

var idcol = 0, originalcol = 1;

premiumRecentSalesReady = function() {
    var $panel = $('#page-content .panel').last(),
        $danger = $panel.find('.label-danger'),
        $pullRight = $panel.find('.panel-heading .pull-right'),
        $checkSales = $('<button class="btn btn-panel btn-primary" id="show-markdown-modal"><i class="fa fa-list-ul"></i> Check exchanges</button>');
    
    if ($danger.text().indexOf('No results found.') == -1) {
        $panel.find('table tr').each(function() {
            var $this = $(this),
                $th = $this.find('th'),
                $td = $this.find('td'),
                $original = $td.eq(originalcol);
            if ($td.length) {
                var $label, $sale = $('<td class="sale" style="width:120px"/>');
                
                if ($original.text() === 'Yes') {
                    $label = $('<span class="label label-danger">None</span>')
                } else {
                    $label = $('<a href="javascript:void(0)" class="check-sale"><span class="label label-info">Check</span></a>')
                }
                
                $sale.append($label);
                $this.append($sale);
                $label.click(labelClicked);
            } else if ($th.length) {
                $th.each(function() {
                    if ($this.text() == 'ItemID') idcol = $this.index();
                });
                
                var $lastExchange = $('<th>Last Exchanged</th>');
                $this.append($lastExchange);
            }
        });
        
        $pullRight.find('a').replaceWith($checkSales);
        $checkSales.click(function() {
            $(this).remove();
            checkSales();
        });
    }
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

labelClicked = function() {
    var $label = $(this), $tr = $label.closest('tr'), id = $tr.find('td').eq(idcol).text();
    
    if (id) ajax(id, $label);
}

ajax = function(id, $label) {
    $.ajax({
        type: 'GET',
        dataType: 'html',
        url: itemURL(id),
        success: function (response) {
            var doc = document.implementation.createHTMLDocument('item'); doc.documentElement.innerHTML = response;
            var data = $(doc).find('#page-content');
            
            checkHistory(data, $label);
        }, error: function (xhr, ajaxOptions, thrownError) {
            // page failed to load
        }
    });
}

checkHistory = function(data, $label) {
    var itemidcol=0,lastseencol=0,ownercol=0,
        previousOwner,previousDate,now=new Date(),
        recentsale=false,hasSales=false,difference,days,al=$(data).find('.alert-danger'),
        duped = al.length && al.text().indexOf('duplicate') > -1,
        gifted = $(data).find('.item-singular .gifted-item').length > 0;
    
    $(data).find('.row').last().find('table tr').each(function() {
        var $this = $(this);
        
        if ($this.find('td').length) {
            var lastseen = $this.find('td').eq(lastseencol),
                owner = $this.find('td').eq(ownercol).text(),
                lastseendate = new Date(lastseen.text()),
                lastseenrawdate = lastseen.text();
                hasSales = previousOwner && previousOwner != owner;
            
            if (hasSales) {
                days = dayDifference(lastseendate, now);
                
                recentsale = days <= 90;
            }
            
            previousDate = lastseendate;
            previousOwner = owner;
        } else if ($this.find('th').length) {
            $this.find('th').each(function() {
                switch ($(this).text()) {
                    case 'Item ID':
                        itemidcol = $(this).index();
                        break;
                    case 'Last Seen':
                        lastseencol = $(this).index();
                        break;
                    case 'Owner':
                        ownercol = $(this).index();
                        break;
                }
            });
        }
        
        return !hasSales;
    });
    
    var $result = $('<span class="label"/>'),
        labelClass = 'label-danger',
        text = '',
        da = days == 1 ? 'day' : 'days';
    
    if (days || days == 0) {
        if (days == 0) {
            text += 'Today';
        } else {
            text += days + ' ' + da + ' ago';
        }
        
        if (duped)  text += '*';
        if (gifted) text += '&#176;';
        
        $result.html(text);
        
        if (days <= 60) {
            labelClass = 'label-success';
        } else if (days <= 90) {
            labelClass = 'label-warning';
        }
    } else {
        $result.text('None');
    }
    
    $result.addClass(labelClass);
    $label.replaceWith($result);
}

dayDifference = function(d1, d2) {
    var oneDay = 24*60*60*1000;

    return Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)))
}

itemURL = function(id) {
    return window.location.protocol + '//' + window.location.hostname + '/item/' + id;
}

$(document).ready(function() {
   premiumRecentSalesReady(); 
});