'use strict';
(function(){
    var basePath,
        scriptVersion;
    var exportsCache = {};
    var callbackQueue = [];

    window.require = function(id, callback) {
        if(!id ) {
            return false;
        }

        // Create a reference to the object that should be populated
        var exports = {};

        // Only use base path for absolute URLs with no domain 
        var isAbsolute = ~id.search(/^(\w+:)?\/\//);
            var isRelToRoot = !isAbsolute && id.charAt(0) === '/';

        if (isRelToRoot && basePath) {
            id = basePath + id.replace(/^\/+/, '');
        }

        if (!isAbsolute && scriptVersion) {
            id = id + '?v=' + scriptVersion;
        };

        window.$LAB = window.$LAB // always reset the "playhead"
        .wait(function(){
            window.$COMMONJS_MODULE = {exports:exports};
        })
        .script(id)
        .wait(function(){
            // if cache exists, module already executed
            var populatedExports = exportsCache[id] || window.$COMMONJS_MODULE.exports;

            // sanitize gobal var
            window.$COMMONJS_MODULE = {exports:exports};

            // if exports object has been replaced, copy the properties
            // from the new object in the it.
            // if populatedExports was pulled from cache, it will never be
            // the original exports object.
            if(populatedExports !== exports){
                for(var i in populatedExports){
                    if(populatedExports.hasOwnProperty(i)){
                        exports[i] = populatedExports[i];
                    }
                }
            }

            // set exports cache
            if(!exportsCache[id]) {
                exportsCache[id] = exports;
            }
       
            if (callback) {
                callbackQueue.push(function executeCallback() {
                    callback(id);
                });
            }

            scheduleCallbackQueueProcessor();
        });

        // this will always be populated on callback, even if the reference
        // to exports gets swapped
        return exports;
    };
    window.wait = window.require.wait = function wait(callback) {
        window.$LAB = window.$LAB.wait(function addCallback() {
            callbackQueue.push(callback);    
        });

        scheduleCallbackQueueProcessor();
    };
    window.require.setBasePath = function setBasePath(path) {
        basePath = path.replace(/\/+$/, '') + '/';
    }
    window.require.setVersion = function setVersion(ver) {
        scriptVersion = ver;
    }

    function scheduleCallbackQueueProcessor() {
        setTimeout(function processQueue() {
            callbackQueue.forEach(function processCallback(callback, idx) {
                callbackQueue[idx] = null;
                callback();
            });
            callbackQueue = callbackQueue.filter(Boolean);
        }, 0);
    }
})();

