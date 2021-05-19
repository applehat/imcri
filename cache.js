class Cache {
    constructor() {
        this.storage = {};
        this.MEMORY_SLOTS = process.env.MEMORY_SLOTS || 10000;
        this.MEMORY_TTL = process.env.MEMORY_TTL || 3600;
        this.EVIC_POLICY = process.env.EVIC_POLICY || "REJECT";
        this.DEBUG = process.env.DEBUG || false;
    }

    /**
     * Put an object in the cache
     * @param {string} key 
     * @param {string} data 
     * @param {int} ttl
     * @returns {bool} true if created, false if failure
     */
    put(key, data, ttl) {
        let expires;
        if (!ttl) {
            // If ttl evaluates to false, set TTL to MEMORY_TTL unless its valua is actually meant to be 0.
            expires = (ttl === 0) ? 0 : (parseInt(this.MEMORY_TTL) + this.curTime());
        } else {
            // Set the expiration timestamp to current time + ttl
            expires = ttl + this.curTime();
        }
        this.debug('put',`TTL: ${ttl} -- Setting expiration for '${key}' to ${expires}. Current time is ${this.curTime()}`);

        let ableToStore = true;
        // handle the logic for storage control here
        if (Object.keys(this.storage).length >= this.MEMORY_SLOTS ) {
            switch(this.EVIC_POLICY) {
                case "REJECT":
                default:
                    // For Reject, we just don't store anything larger then allowed.
                    // We will allow the update of a key that already exits tho.
                    if (!this.hasKey(key)) {
                        this.debug('put','Triggered EVIC_POLICY Reject');
                        ableToStore = false;
                    }
                break;
                case "OLDEST_FIRST":
                    let [getOldestKey] = Object.entries(this.storage).sort(([,a],[,b]) => a.created - b.created);
                    let oldestKey = getOldestKey[0];
                    this.debug('put',`Triggered EVIC_POLICY Oldest First -- Deleting Key ${oldestKey}`);
                    if (!this.del(oldestKey)) {
                        ableToStore = false;
                    }
                break;
                case "NEWEST_FIRST":
                    let [getNewestKey] = Object.entries(this.storage).sort(([,a],[,b]) => b.created - a.created);
                    let newestKey = getNewestKey[0];
                    this.debug('put',`Triggered EVIC_POLICY Newest First -- Deleting Key ${newestKey}`);
                    if (!this.del(newestKey)) {
                        ableToStore = false;
                    }
                break;
            }
        }
        if (ableToStore) {
            this.storage[key] = {
                created: this.curTime(),
                expires: expires,
                data: data
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * Get an object from the cache
     * @param {string} key 
     * @returns string | false
     */
    get(key) {
        this.debug('get',`Checking for '${key}'`);
        if (this.hasKey(key)) {
            this.debug('get',`Key '${key}' exists`);
            return this.isExpired(key) ? false : this.storage[key].data
        } else {
            this.debug('get',`Key '${key}' does not exists`);
            return false;
        }
    }

    /**
     * Delete an object from the cache
     * @param {string} key 
     * @returns {bool}
     */
    del(key) {
        if (this.hasKey(key)) {
            this.debug('delete',`Key '${key}' exists`);
            if (this.isExpired(key)) {
                this.debug('delete',`Key '${key}' was expired and removed, can't delete.`);
                return false;
            }
            this.debug('delete',`Key '${key}' was deleted.`);
            return true;
        } else {
            this.debug('delete',`Key '${key}' does not exists`);
            return false;
        }
    }

    /**
     * 
     * @param {string} key 
     * @returns {bool} is object expired or not
     */
    isExpired(key) {
        let expireTime = this.storage[key].expires;
        this.debug('isExpired',`Checking expiration for '${key}' -- ${expireTime} -- ${this.curTime()}`);
        let expired = (expireTime !== 0 && expireTime <= this.curTime());
        if (expired) {
            this.debug('isExpired',`Found expired object at '${key}' -- deleting`);
            delete this.storage[key];
            return true;
        }
        return false;            
    }

    /**
     * 
     * @param {string} key 
     * @returns {bool} if key exists in storage
     */
    hasKey(key) {
        return (key in this.storage);
    }

    /**
     * Get current timestamp in seconds
     * @returns {int} current time
     */
    curTime() {
        return Math.floor(Date.now() / 1000)
    }

    /**
     * Somewhat useful debug, only if DEBUG enabled.
     * @param {string} method 
     * @param {string} message 
     */
    debug(method,message) {
        if (this.DEBUG) {
            console.log(`[${method}] `,message);
        }
    }
}
module.exports = new Cache();