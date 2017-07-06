var block = ctx.getConfig('block') || [];
// cancel if desired endpoint is not specified
cancelUnless(parts.length
    && block.indexOf(parts[0]) === -1, 'Access denied!', 403);
// remove hyphen from url resource endpoint name
var colName = parts[0].replace('-', ''),
    // get pagination query while checking if 
    // resource supports querying if querying
    query = ctx.paginationQuery(parts, true);
// Querying but resource doesn't support it
if (!query) setResult([]);
// limit recursion
query.$limitRecursion = 6;
// get desired target
dpd[colName].get(query, setResult);