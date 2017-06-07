// cancel if desired endpoint is not specified
cancelUnless(parts.length);
// update query limit for db
query.$limit = query.limit || 20;
// remove hyphen from url resource endpoint name
var colName = parts[0].replace('-', ''),
        page = query.page || 1;
// create query skip
query.$skip = query.$limit * (page - 1);
// remove unneeded query keys
delete query.limit;
delete query.page;
// limit recursion
query.$limitRecursion = 6;
// check if should parse query
if (query.query) {
    var queried = false,
            queryKeys = ctx.getConfig('queryKeys', null, parts[0]);
    if (queryKeys) {
        // check for EventResource parts
        if (parts[1] && queryKeys[parts[1]]) queryKeys = queryKeys[parts[1]];
        // queryKeys must be an array
        if (Array.isArray(queryKeys) && queryKeys.length) {
            query.$or = [];
            // loop over each key
            queryKeys.forEach(function (key) {
                var obj = {};
                // set the query for key with regex
                obj[key] = {
                    $regex: query.query,
                    $options: "i"
                };
                // add to the or query key
                query.$or.push(obj);
                // mark as queried
                queried = true;
            });
            // delete query key if already used
            if (queried) delete query.query;
        }
    }
}
// get desired target
dpd[colName].get(query, setResult);
