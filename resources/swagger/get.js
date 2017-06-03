var swagger = ctx.getConfig('setup', {}),
        swagtool = require('dpd-swagger-doc');
swagtool.initResources(swagger, ctx.dpd);
ctx.done(false, swagger);
