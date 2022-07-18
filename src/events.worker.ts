import { EventSourcePolyfill } from 'event-source-polyfill';
import conf_promise from './config'

var token = null

var conf

conf_promise.then(c => {conf = c})

export function getEventSource(url: string): EventSource {
    return new EventSourcePolyfill(url, { headers: { Authorization: `Bearer ${token}` }})
}

class RunEventsAggregator {
    private es: EventSource = null
    private run_ids: {[id: string]: EventListener[]} = {}
    private recreateEs() {
        if(this.es) this.es.close()
        const ids = Object.keys(this.run_ids)
        if (ids.length == 0) return
        this.es = getEventSource(`${conf.apiUrl}/events/runs/?${ids.map(id => 'id=' + id).join('&')}`)
        this.es.addEventListener('update', this.handleRunChange)
    }
    private handleRunChange = (e) => {
        const run_id = e.data
        const listeners = this.run_ids[run_id]
        if (!listeners) return
        listeners.forEach(callback => callback(e));
    }
    addRunListener(run_id: string, callback: EventListener) {
        if (!this.run_ids[run_id]) {
            this.run_ids[run_id] = [callback]
            this.recreateEs()
        } else 
            this.run_ids[run_id].push(callback)
    }
    removeRunListener(run_id: string, callback: EventListener) {
        this.run_ids[run_id] = this.run_ids[run_id].filter(c => c !== callback)
        if(this.run_ids[run_id].length == 0){
            delete this.run_ids[run_id]
            this.recreateEs()
        }
    }
}

class ChangeEventSource {
    constructor() {
        setInterval(this.closeOnEmptyListeners, 5000)
    }
    #global: EventTarget = null
    #runs: RunEventsAggregator = new RunEventsAggregator()
    #tasks: EventTarget = null
    get global() {
        if(!this.#global)
            this.#global = getEventSource(`${conf.apiUrl}/events/`)
        return this.#global
    }
    get tasks() {
        if(!this.#tasks)
            this.#tasks = getEventSource(`${conf.apiUrl}/events/tasks`)
        return this.#tasks
    }

    get runs () { return this.#runs }

    private closeOnEmptyListeners = () => {
        // if (this.#global && (this.#global as any)._listeners.length == 0) {
        //     (this.#global as any).close() 
        //     this.#global = null
        // }
        if (this.#tasks) {
            const listeners = (this.#tasks as any)._listeners
            if (Math.max(0, ...Object.entries(listeners).map((ent)=> (ent[1] as any[]).length)) == 0) {
                (this.#tasks as any).close() 
                this.#tasks = null
            }
        }
    }
}

const events = new ChangeEventSource();


(self as any).onconnect = (e) => {
    const port: MessagePort = e.ports[0];
    console.log('Connected worker')

    const handleGlobalChange = () => {
        port.postMessage({level: 'global'})
    }
    const handleTasksUpdate = (ev) => {
        port.postMessage({level: 'tasks', type: 'update', data: ev.data})
    }
    const handleTasksDelete = (ev) => {
        port.postMessage({level: 'tasks', type: 'delete', data: ev.data})
    }

    const handleRunChange = (ev) => {
        port.postMessage({level: 'run', data: ev.data})
    }
    
    port.addEventListener('message', (e: {data: {op: string, pars?: any}}) => {
        const cmd = e.data
        console.log(cmd)
        if(cmd.op == 'settoken') {
            token = cmd.pars
        }
        if(cmd.op == 'subscribeglobal') {
            events.global.addEventListener('update', handleGlobalChange)
        }
        if(cmd.op == 'unsubscribeglobal') {
            events.global.removeEventListener('update', handleGlobalChange)
        }
        if(cmd.op == 'subscribetasks') {
            events.tasks.addEventListener('update', handleTasksUpdate)
            events.tasks.addEventListener('delete', handleTasksDelete)
        }
        if(cmd.op == 'unsubscribetasks') {
            events.tasks.removeEventListener('update', handleTasksUpdate)
            events.tasks.removeEventListener('delete', handleTasksDelete)
        }
        if(cmd.op == 'subscriberun') {
            events.runs.addRunListener(cmd.pars, handleRunChange)
        }
        if(cmd.op == 'unsubscriberun') {
            events.runs.removeRunListener(cmd.pars, handleRunChange)
        }
    })
    port.start(); 
}