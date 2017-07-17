'use strict';
(function() {
    var basePath,
        scriptVersion,
        currentCallbackChain;
    var exportsCache = {};
    var nonQueuedRequireIds = {};
    var callbackChains = []; // FILO

    window.$COMMONJS_MODULE = {exports: {}};

    window.require = function(id, callback) {
        if (!id) {
            return false;
        }

        currentCallbackChain = [];
        callbackChains.unshift(currentCallbackChain);

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

        nonQueuedRequireIds[id] = nonQueuedRequireIds[id] + 1 || 1;

        window.$LAB = window.$LAB.wait(function() { // always reset the "playhead"
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

            wait(callback, id);
        });

        // this will always be populated on callback, even if the reference
        // to exports gets swapped
        return exports;
    };
    window.wait = window.require.wait = function wait(callback, id) {
        if (id) {
            nonQueuedRequireIds[id] --;
            !nonQueuedRequireIds[id] && delete nonQueuedRequireIds[id];
        }
        if (callback) {
            currentCallbackChain.push(callback);
        }
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
            if (Object.keys(nonQueuedRequireIds).length === 0) {
                callbackChains.forEach(function processChain(chain, idx) {
                    chain.forEach(function processCallback(callback) {
                        if (callback) {
                            window.$LAB = window.$LAB.wait(callback);
                        }
                    });
                });

                // Reset the execution chains
                currentCallbackChain = [];
                callbackChains = [currentCallbackChain];
            }
        }, 0);
    }
})();
