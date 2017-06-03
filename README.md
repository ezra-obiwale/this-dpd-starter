# this-dpd-starter
A starter bootstrap for [Deployd](http://deployd.com) with [Twitter Bootstrap 3](http://getbootstrap.com) and [ThisJs](https://github.com/ezra-obiwale/this-js).

Out of the box features include:

1. Registration (email/password or social media (facebook/google))
2. Email Verification
3. Login (email/password or social media (facebook/google))
4. API key generation and validation (user no longer on `me` but `ctx.req.user`)
5. Password Reset
6. Admin starter page
7. Logout

Note: For social media, you need to fill in the required fields from **dashboard** &rarr; **auth**

This package includes the following dependencies:

- **passport @ v2.2**           - *stable version of passport and a dependency of dpd-passport*
- **dpd-passport**              - *for social media login*
- **sparkpost**                 - *for sending emails*
- **dpd-api-token**             - *for api key processing*
- **dpd-event-callback**        - *for endpoints without database collections*
- **dpd-feeder**                - *for importing data into collections*
- **dpd-fileupload**            - *for file upload*
- **string-hash**               - *for hashing string*
- **[node-utils](https://github.com/ezra-obiwale/node-dpd-utils)** - *a collection of functions that would be used over and over*