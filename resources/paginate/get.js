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
// get desired target
dpd[colName].get(query, setResult);