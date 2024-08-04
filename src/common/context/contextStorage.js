const asyncHooks = require('async_hooks');

class ContextStorage {
    constructor() {
        this.store = new Map();
        this.hook = asyncHooks.createHook({
            init: (asyncId, type, triggerAsyncId) => {
                if (this.store.has(triggerAsyncId)) {
                    this.store.set(asyncId, this.store.get(triggerAsyncId));
                }
            },
            destroy: (asyncId) => {
                this.store.delete(asyncId);
            }
        });
        this.hook.enable();
    }

    run(fn, value) {
        const eid = asyncHooks.executionAsyncId();
        this.store.set(eid, value);
        try {
            return fn();
        } finally {
            this.store.delete(eid);
        }
    }

    getStore() {
        return this.store.get(asyncHooks.executionAsyncId());
    }

    setStore(value) {
        this.store.set(asyncHooks.executionAsyncId(), value);
    }
}

const asyncLocalStorage = new ContextStorage();
module.exports = asyncLocalStorage;
