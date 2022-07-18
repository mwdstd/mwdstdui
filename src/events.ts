const worker = new SharedWorker(new URL('./events.worker', import.meta.url))
const port = worker.port


class RunEventsAggregator {
    private run_ids: {[id: string]: EventListener[]} = {}
    addRunListener(run_id: string, callback: EventListener) {
        port.postMessage({op: 'subscriberun', pars: run_id})
        if (!this.run_ids[run_id]) {
            this.run_ids[run_id] = [callback]
        } else 
            this.run_ids[run_id].push(callback)
    }
    removeRunListener(run_id: string, callback: EventListener) {
        port.postMessage({op: 'unsubscriberun', pars: run_id})
        this.run_ids[run_id] = this.run_ids[run_id]?.filter(c => c !== callback)
        if(this.run_ids[run_id].length == 0){
            delete this.run_ids[run_id]
        }
    }
    notifyListeners(run_id: string) {
        const listeners = this.run_ids[run_id]
        if (!listeners) return
        listeners.forEach(callback => callback(null));
    }
}

class ListenersCountingEventTarget extends EventTarget {
    private readonly listeners: {[type: string]: EventListenerOrEventListenerObject[]} = {}
    constructor() {
        super()
    }
    addEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        super.addEventListener(type, callback, options)
        if (!this.listeners[type])
            this.listeners[type] = [callback]
        else
            this.listeners[type].push(callback)
    }
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
        super.removeEventListener(type, callback, options)
        this.listeners[type] = this.listeners[type]?.filter(c => c != callback)
    }
    get count() { return Object.values(this.listeners).flat().filter(x => x).length }
}

class ChangeEventSource {
    constructor() {
        setInterval(this.closeOnEmptyListeners, 5000)
    }
    #global: ListenersCountingEventTarget
    get global() {
        if(!this.#global) {
            port.postMessage({op: 'subscribeglobal'})
            this.#global = new ListenersCountingEventTarget()
        }
        return this.#global
    }
    #tasks: ListenersCountingEventTarget
    get tasks() {
        if(!this.#tasks) {
            this.#tasks = new ListenersCountingEventTarget()
            port.postMessage({op: 'subscribetasks'})
        }
        return this.#tasks
    }
    readonly runs: RunEventsAggregator = new RunEventsAggregator()

    private closeOnEmptyListeners = () => {
        if (this.#global && this.#global.count == 0) {
            port.postMessage({op: 'unsubscribeglobal'})
            this.#global = null
        }
        if (this.#tasks && this.#tasks.count == 0) {
            port.postMessage({op: 'unsubscribetasks'})
            this.#tasks = null
        }
    }
}

export const events = new ChangeEventSource()


port.onmessage = (ev: MessageEvent<{level: string, type: string, data: any}>) => {
    if (ev.data.level == 'global')
        events.global.dispatchEvent(new Event('update'))
    if (ev.data.level == 'tasks')
        events.tasks.dispatchEvent(new MessageEvent(ev.data.type, {data: ev.data.data}))
    if (ev.data.level == 'run')
        events.runs.notifyListeners(ev.data.data)
}

export const setToken = (t: string) => {
    port.postMessage({op: 'settoken', pars: t})
}
