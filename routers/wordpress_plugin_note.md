WordPress Plugin Instructions for Backend Teammate
===================================================

When someone subscribes or fills a form on the WordPress site,
the plugin should send a POST request to:

URL: https://yourapp.com/wordpress

Headers:
  x-api-key: (get this from the .env file)
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "name": "User Name",
  "event": "new_subscriber",
  "website": "https://clientwebsite.com"
}