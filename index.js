require('dotenv').config()
const http = require('http');
//const URL = require('url');
const cache = require('./cache');
const PORT = process.env.PORT || 80;

// Create endpoints
const server = http.createServer((req, res) => {
    let responseHeaders = {'Content-type' : 'application/json'};
    // regex the url to make sure it a valid /object/{key} url
    let match = req.url.match(/^\/object\/\w+/);
    if (match) {
        // We have our key
        let key = match[0].replace('/object/','');

        // Getter Method
        if (req.method == 'GET') {
            let data = cache.get(key);
            if (data) {
                res.writeHead(200, responseHeaders);
                res.write(data);
            } else {
                res.writeHead(404, responseHeaders);
                res.write(JSON.stringify({
                    error: `No object was found at key '${key}'.`
                }));
            }
            res.end();
        }

        // Setter Method
        if (req.method == 'POST' || req.method == 'PUT') {
            // Just as a note, generally a POST creates a new object, and a PUT updates it.
            // Arguably, we should throw an error in cache.hasKey(key) is true and the method is POST.

            // Does the setter have a TTL supplied?
            const params = new URL(req.url, 'https://localhost/').searchParams; // the URL class requires a base to properly parse relative URLs. 
            let ttl = params.get('ttl') ? parseInt(params.get('ttl')) : null;
        
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            })
            req.on('end', () => {
                /**
                    There is no real reason we can't store invalid 
                    JSON objects, since we store them as strings,
                    but the spec calls for storing JSON objects,
                    so we are only going to store JSON objects.

                    Adding an additional response to this of 500 if the data provided is invalid.
                 */
                try {
                    JSON.parse(data); // This will throw a catchable error if invalid JSON is passed.
                    
                    if(cache.put(key, data, ttl)) {
                        // we did it!
                        res.writeHead(200, responseHeaders);
                    } else {
                        res.writeHead(507, responseHeaders);
                        res.write(JSON.stringify({
                            error: `Your request to store this object failed because the cache is full.`
                        }));
                    }
                } catch (e) {
                    console.log(e);
                   res.writeHead(500, responseHeaders);
                   res.write(JSON.stringify({
                       error: `The object provided in the body of your request was not valid JSON.`
                   }));
                }
                res.end();
            })
        }

        // Delete Methpd
        if (req.method == 'DELETE') {
            if (cache.delete(key)) {
                res.writeHead(200, responseHeaders);
            } else {
                res.writeHead(404, responseHeaders);
                res.write(JSON.stringify({
                    error: `The specified key was not found in the system.`
                }));
            }
        }

    } else {
        res.writeHead(404, responseHeaders);
        res.write(JSON.stringify({
            error: "The method you are trying to call in invalid."
        }));
        res.end();
    }   
   
})

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
})