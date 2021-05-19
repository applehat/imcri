# In-memory Cache with REST interface

This is an example of writing an in-memory cache in NodeJS that is interfaced using a REST api.

For the purposes of this demonstration, I have not used any external libraries related to caching or http,
but would note that generally speaking you would be better off leveraging a well documented and maintained
projects in the open source community to achieve the goals here.

If you happen to run across this repo, I'd suggest looking into using Redis or Memcached, as I suspect
either project will provide more flexibility and stability then this simple proof of concept.

If you find yourself in need of REST in node, a good starting point would be to use the Express framework.

## Usage


## Config

All configuration is handled in the `.env` file.

| Config Variable | Type | Default | Description |
|-----------------|------|---------|-------------|
| `MEMORY_SLOTS`  | int  | 10000 | Maximum number of objects to be stored simultaneously in the server’s memory. If the server runs out of slots it will behave according to the Eviction Policy setting |
| `MEMORY_TTL`     | int  | 3600 | Object’s default time-to-live value in seconds if no TTL is specified as part of a write request. If TTL is set to 0 that means store indefinitely (until an explicit DELETE request) |
| `EVIC_POLICY` | enum | REJECT | This indicates what to do when the cache runs out of slots. Options are `OLDEST_FIRST`,`NEWEST_FIRST`, and `REJECT`

### Evacuation Policy Breakdown
- `OLDEST_FIRST`: If there are no slots available the cache will evict the oldest active object
and store the new object in its place
- `NEWEST_FIRST`: If there are no slots available the cache will evict the newest active
object first and store the new object in its place
- `REJECT`: When the cache runs out of storage it just reject the store request

## REST Interface

### GET /object/{key}
This will return the object stored at {key} if the object is not expired.

Returns:
- 200: If the object is found and not-expired
- 404: If the object is not found or expired

### POST or PUT /object/{key}?ttl={ttl}
This will insert the {object} provided in the body of the request into a slot in memory at {key}. If {ttl} is not specified it will use server’s default TTL from the config, if ttl=0 it will store indefinitely

Returns
- 200: If the server was able to store the object
- 507: If the server has no storage

### DELETE /object/{key}
This will delete the object stored at slot {key}

Returns
- 200: If the object at {key} was found and removed
- 404: If the object at {key} was not found or expired