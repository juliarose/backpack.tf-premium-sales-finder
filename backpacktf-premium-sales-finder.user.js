// ==UserScript==
// @name        backpack.tf Premium Recent Sales Finder
// @namespace   http://steamcommunity.com/profiles/76561198080179568/
// @author      Julia
// @description Find recent sales for those hats :3
// @include     /https?:\/\/backpack\.tf\/premium\/search.*/
// @version     1.1.0
// @grant       none
// ==/UserScript==

var idcol = 0;

_ready = function() {
    var panel = $('#page-content .panel').last(),
        checkSales = $('<a href="javascript:void(0)">Check exchanges for each item</a>');
    
    panel.find('table tr').each(function() {
        if ($(this).find('td').length) {
            var label = $('<a href="javascript:void(0)" class="check-sale"><span class="label label-info">Check</span></a>'),
                td = $('<td class="sale" style="width:120px"/>').append(label);
            
            $(this).append(td);
            
            label.click(function() {
                _labelClicked($(this));
            });
        } else if ($(this).find('th').length) {
            $(this).find('th').each(function() {
                if ($(this).text() == 'ItemID') {
                    idcol = $(this).index();
                }
            });
            
            var th = $('<th>Last Exchanged</th>');
            
            $(this).append(th);
        }
    });
    
    panel.find('.panel-heading .pull-right a').replaceWith(checkSales);
    
    checkSales.click(function() {
        $(this).remove();
        
        _checkSales();
    });
}

_checkSales = function() {
    var n = 0, gap = 300;
    
    $('.check-sale').each(function() {
        var e = this;
        
        setTimeout(function() {
            $(e).trigger('click');
        }, n);
        
        n += gap;
    });
}

_labelClicked = function(label) {
    var id = label.closest('tr').find('td').eq(idcol).text();
    
    if (id) {
        _ajax(id, label);
    }
}

_ajax = function(id, label) {
    $.ajax({
        type: 'GET',
        dataType: 'html',
        url: _itemURL(id),
        success: function (response) {
            var doc = document.implementation.createHTMLDocument('item'); doc.documentElement.innerHTML = response;
            var data = $(doc).find('#page-content');
            
            _checkHistory(data, label);
        }, error: function (xhr, ajaxOptions, thrownError) {
        }
    });
}

_checkHistory = function(data, label) {
    var itemidcol=0,lastseencol=0,ownercol=0,
        previousOwner,previousDate,now=new Date(),
        recentsale=false,hasSales=false,difference,days,al=$(data).find('.alert-danger'),
        duped = al.length && al.text().indexOf('duplicate') > -1,
        gifted = $(data).find('.item-singular .gifted-item').length > 0;
    
    $(data).find('.row').last().find('table tr').each(function() {
        if ($(this).find('td').length) {
            var lastseen = $(this).find('td').eq(lastseencol),
                owner = $(this).find('td').eq(ownercol).text(),
                lastseendate = new Date(lastseen.text()),
                lastseenrawdate = lastseen.text();
                hasSales = previousOwner && previousOwner != owner;
            
            if (hasSales) {
                days = _dayDifference(lastseendate, now);
                
                recentsale = days <= 90;
            }
            
            previousDate = lastseendate;
            previousOwner = owner;
        } else if ($(this).find('th').length) {
            $(this).find('th').each(function() {
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
    
    var result = $('<span class="label"/>'), labelClass = 'label-danger';
    
    if (days || days == 0) {
        var text;
        
        if (days == 0) {
            text = 'Today';
        } else {
            var da = days == 1 ? 'day' : 'days';
            
            text = days + ' ' + da + ' ago';
        }
        
        if (duped) {
            text += '*';
        }
        
        if (gifted) {
            text += '&#176;';
        }
        
        result.html(text);
        
        if (days <= 60) {
            labelClass = 'label-success';
        } else if (days <= 90) {
            labelClass = 'label-warning';
        }
    } else {
        result.text('None');
    }
    
    result.addClass(labelClass);
    
    label.replaceWith(result);
}

_dayDifference = function(d1, d2) {
    var oneDay = 24*60*60*1000;

    return Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)))
}

_itemURL = function(id) {
    return window.location.protocol + '//' + window.location.hostname + '/item/' + (id || '');
}

$(document).ready(function() {
   _ready(); 
});