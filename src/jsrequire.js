'use strict';
(function(){
    var exportsCache = {};
    var callbackQueue = [];

    window.require = function(id, callback) {
        // Create a reference to the object that should be populated
        var exports = {};

        window.$LAB = window.$LAB // always reset the "playhead"
        .wait(function(){
            window.$COMMONJS_MODULE = {exports:exports};
        })
        .script(id) // assume id is a fully qualified path, for now
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
    window.wait = window.require.wait = function(callback) {
        window.$LAB = window.$LAB.wait(function addCallback() {
            callbackQueue.push(callback);    
        });

        scheduleCallbackQueueProcessor();
    };

    function scheduleCallbackQueueProcessor() {
        setTimeout(function processQueue() {
            callbackQueue.forEach(function processCallback(callback) {
                callback();
            });
            callbackQueue = [];
        }, 0);
    }
})();

