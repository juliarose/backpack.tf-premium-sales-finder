'use strict';

// node.js is required to use this script!

// so this isn't anything too complex
// it's just a way for me to split up files independent of each other
// so they are easier to maintain, since the whole script has gotten quite large
// the file generated compiles to something readable and doesn't look much 
// different from writing the whole thing on its own
// 
// what this does:
// takes the scripts for each page and concats them into one big script
// inserts a dependencies object inside of an IIFE, which is then passed to each page function
// adds the styles defined for each page
// then creates a script for picking which script to run, and runs that script

const fs = require('fs');
const path = require('path');

// gets n number of tabs
const getTabs = (count) => {
    // 4 spaces
    const TAB = '    ';
    
    return Array(count).fill(TAB).join('');
};
// it's a script that writes scripts
// well not really...
// it just strings together an array of script code so that it looks nice
const writeScript = (arr, depth = 0) => {
    return arr
        // remove empty values
        .filter(Boolean)
        .map((item) => {
            if (Array.isArray(item)) {
                // yes, this is an array
                // that means we can recurse!!!+1
                return writeScript(item, depth + 1);
            } else {
                return getTabs(depth) + item;
            }
        })
        .join('\n');
};
// indents a block of code by 'depth' of levels
const indentBlock = (str, depth) => {
    return str.replace(/^/gm, getTabs(depth));
};
// encloses code in an IIFE
const encloseInIIFE = (str, depth = 1) => {
    return [
        '(function() {',
            // increase indentation of string
            indentBlock(str, depth),
        '}());'
    ].join('\n');
};

function builder({scripts, directory}) {
    const getPath = (filename) => {
        return path.join(directory, filename);
    };
    const meta = fs.readFileSync(getPath('meta.js'), 'utf8');
    const deps = fs.readFileSync(getPath('deps.js'), 'utf8');
    const depsStr = 'const DEPS = ' + encloseInIIFE(deps);
    
    const includesStr = scripts.map(({pattern, include_pattern}) => {
        return '// ' + '@include'.padEnd(13, ' ') + (include_pattern || pattern);
    }).join('\n');
    const metaStr = meta.replace('\'includes\';', includesStr);
    const methodsStr = scripts.map(({name}) => {
        const scriptPath = getPath(`${name}.js`);
        const script = fs.readFileSync(scriptPath, 'utf8');
        
        return script;
    }).join('\n\n');
    const scriptsStr = scripts.map(({name, pattern}) => {
        const stylesPath = getPath(`${name}.css`);
        const styles = fs.existsSync(stylesPath) ? fs.readFileSync(stylesPath, 'utf8') : null;
        const depth = 1;
        const details = [
            '{',
                [
                    `pattern: ${pattern},`,
                    styles && 'styles: `\n' + indentBlock(styles, depth + 2) + '\n' + getTabs(depth + 1) + '`,',
                    `method: ${name}`,
                ],
            '}'
        ];
        const jsStr = writeScript(details, depth);
        
        return jsStr;
    }).join(',\n');
    const runScriptsStr = '// run the page scripts\n' + encloseInIIFE(
        writeScript([
            depsStr,
            `const scripts = [\n${scriptsStr}\n];`,
            `const script = scripts.find(({pattern}) => pattern.test(location.href));\n`,
            `if (script) {`,
                [
                    'if (script.styles) {',
                    [
                        '// add the styles',
                        'GM_addStyle(script.styles);'
                    ],
                    '}\n' + getTabs(1),
                    '// run the script',
                    'script.method(DEPS);'
                ],
            '}'
        ])
    );
    const outputStr = [
        metaStr,
        encloseInIIFE([
            '\n\'use strict\';',
            methodsStr,
            runScriptsStr + '\n'
        ].join('\n\n'), 0)
    ].join('\n\n');
    
    return {
        script: outputStr,
        meta: metaStr
    };
}

module.exports = builder;