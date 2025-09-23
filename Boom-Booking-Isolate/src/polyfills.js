// Polyfills for browser compatibility
if (typeof globalThis === 'undefined') {
  window.globalThis = window;
}

// Polyfill for Request object if not available
if (typeof Request === 'undefined') {
  window.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body;
      this.mode = init.mode || 'cors';
      this.credentials = init.credentials || 'same-origin';
      this.cache = init.cache || 'default';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || 'about:client';
    }
  };
}

// Polyfill for Headers if not available
if (typeof Headers === 'undefined') {
  window.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {};
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value;
          });
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value;
          });
        }
      }
    }
    
    get(name) {
      return this._headers[name.toLowerCase()] || null;
    }
    
    set(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
    
    has(name) {
      return name.toLowerCase() in this._headers;
    }
    
    delete(name) {
      delete this._headers[name.toLowerCase()];
    }
    
    forEach(callback) {
      Object.entries(this._headers).forEach(([key, value]) => {
        callback(value, key, this);
      });
    }
  };
}
