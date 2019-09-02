function getPremium({$, dayDifference}) {
    const PAGE = {
        $results: $('.premium-search-results .result')
    };
    
    function highlightResults($results) {
        function highlightOwner($result, days) {
            function prependClass($element, front) {
                const classes = $element.attr('class');
                
                $element.attr('class', [front, classes].join(' '));
            }
            
            const $buttons = $result.find('.buttons a');
            
            // add coloring depending on how long ago the hat was last sold
            if (days <= 60) {
                // we add it to the beginning of the classlist
                // because the order of classes takes priority in styling (from first to last)
                prependClass($buttons, 'btn-success');
                $result.addClass('success');
            } else if (days <= 90) {
                prependClass($buttons, 'btn-warning');
                $result.addClass('warning');
            } else if (days <= 120) {
                prependClass($buttons, 'btn-danger');
                $result.addClass('danger');
            }
        }
        
        $results.each((i, el) => {
            const $result = $(el);
            const $previousOwner = $result.find('.owners .owner').eq(1);
            const $time = $previousOwner.find('abbr');
            
            if ($time.length > 0) {
                const date = new Date($time.attr('title'));
                const now = new Date();
                const days = dayDifference(now, date);
                
                highlightOwner($result, days);
            }
        });
    }
    
    highlightResults(PAGE.$results);
}