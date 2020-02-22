# Go
A custom short URL implementation with only a HTTP REST API exposed.

## Routes
A list of all the routes exposed from the app.

GET: `go.krantz.dev/<name>` - Navigate to a shortlink

## API
These routes all require the `Authorization` header containing an ID token. See [here](https://firebase.google.com/docs/auth/admin/verify-id-tokens) for how to get the token.

GET: `go.krantz.dev/api/` - Get a list of all the shortlinks<br>
POST: `go.krantz.dev/api/` - Create a new shortlink, required data: `name`, `link`<br>
GET: `go.krantz.dev/api/<name>` - Get information about a specific shortlink<br>
PUT: `go.krantz.dev/api/<name>` - Update a specific shortlink, required data: `link`<br>
DELETE: `go.krantz.dev/api/<name>` - Delete a specific shortlink
