// our window object
const WINDOW = unsafeWindow;

// get our global variables from the window object
const {$} = WINDOW;

/**
 * Super basic omitEmpty function.
 * @param {Object} obj - Object to omit values from.
 * @returns {Object} Object with null, undefined, or empty string values omitted.
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
 * Get difference in days between two dates.
 * @param {Object} date1 - First date.
 * @param {Object} date2 - Second date.
 * @returns {Number} Difference.
 */
function dayDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const difference = Math.abs(date1.getTime() - date2.getTime());
    
    return Math.round(difference / oneDay);
}

return {
    WINDOW,
    $,
    omitEmpty,
    dayDifference
};