function getInventory({$}) {
    // jquery elements
    const PAGE = {
        $snapshots: $('#historicalview option')
    };
    
    // update the location so that each timestamp is at the closest time according to recorded inventory snapshots
    function changeLocation({$snapshots}) {
        /**
         * Get closet snapshot time according to timestamp.
         * @param {Number[]} snapshots - Array of snapshot unix timestamps.
         * @param {Number} timestamp - Unix timestamp.
         * @param {Boolean} [before] - Whether the closest snapshot should appear before 'timestamp'.
         * @param {Number} [other] - Snapshot must not be the same as this value.
         * @returns {(Number|null)} Closest snapshot to date.
         */
        function getClosestSnapshot(snapshots, timestamp, before, other) {
            // sort ascending
            const asc = (a, b) => (b - a);
            // sort descending
            const desc = (a, b) => (a - b);
            
            // loop until we find the first result that is at or before the timestamp if "before" is set to true
            // when "before" is set, array is sorted in descending order, or ascending if not set
            return snapshots.sort(before ? desc : asc).find((snapshot) => {
                let isBefore = timestamp <= snapshot;
                let isAfter = timestamp >= snapshot;
                let isOther = snapshot === other;
                
                return (
                    before ? isBefore : isAfter
                ) && !isOther; // snapshot must also not be the same as "other"
            }) || (before ? Math.min : Math.max)(...snapshots);
            // default value is first or last snapshot if one did not meet conditions
            // will probably only default to this if the time is closest to the first or last snapshot
            // or with one-snapshot inventories 
        }
        
        // generate page snapshots
        const snapshots = $snapshots.map((i, el) => {
            return parseInt(el.value);
        }).get().filter(Boolean);
        const pattern = /(\d{10})\/(\d{10})\/nearest$/;
        // should always match
        const timestamps = location.href.match(pattern).slice(1).map(a => parseInt(a)); 
        // must be at or before the first date
        const from = getClosestSnapshot(snapshots, timestamps[0], true); 
        // must be at or before the second date, and not the same date as 'from'
        const to = getClosestSnapshot(snapshots, timestamps[1], false, from); 
        
        // finally update location.href using new timestamps
        location.href = location.href.replace(pattern, [from, to].join('/'));
    }
    
    changeLocation(PAGE);
}