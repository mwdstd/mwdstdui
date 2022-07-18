import m from 'mithril'
import { Action, authorized, ObjType } from '../actrl'
import { events } from '../events'
import { TasksModel } from "../models"
import { BoreholeDb, DbObject, Task, TaskStatus, TaskType, WellDb } from "../types"
import { download } from '../utils'
import { BaseModelVm, BaseVm } from "./common"

export class TasksVm extends BaseVm {
    tasks: Task[]
    constructor() {
        super()
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.tasks = await TasksModel.loadList()
    }
    async exportRequest(t: Task) {
        let data = await TasksModel.exportRequest(t.id)
        download(JSON.stringify(data, null, ' '), `Task(${t.type})-${t.id}.json`, `application/json`)
    }
}

export class TaskVm extends BaseModelVm {
    #task_type: TaskType
    #parent: DbObject
    #task?: Task
    #onFinish?: () => Promise<void>
    authorized: boolean
    constructor(task_type: TaskType, parent: DbObject, onFinish?: () => Promise<void>) {
        super(TasksModel)
        this.#task_type = task_type
        this.#parent = parent
        this.#onFinish = onFinish
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.authorized = authorized(this.user.role, ObjType.Task, Action.Create, this.#parent)
        this.subscribeToEvents()
        await this.update()
    }

    private handleTaskUpdate = async (e: any) => {
        const data = JSON.parse(e.data)
        if(data.parent_id == this.#parent.id && data.type == this.#task_type) {
            this.#task = data
            if(['completed', 'faulted'].includes(this.#task.status)) {
                if(this.#onFinish)
                    await this.#onFinish()
            }
            m.redraw()
        }
    }

    private handleTaskDelete = async (e: any) => {
        if(e.data == this.#task.id)
            this.#task = null
        m.redraw()
    }
    
    private subscribeToEvents() {
        events.tasks.addEventListener('update', this.handleTaskUpdate)
        events.tasks.addEventListener('delete', this.handleTaskDelete)
    }

    private async update() {
        if(!this.authorized) return
        let list = await this.model.loadList(this.#parent.id);
        this.#task = list.find(t => t.type == this.#task_type)
    }

    protected ondestroy(): void {
        events.tasks.removeEventListener('update', this.handleTaskUpdate)
        events.tasks.removeEventListener('delete', this.handleTaskDelete)
    }

    async updateParent(parent: any) {
        this.#parent = parent
        this.authorized = authorized(this.user.role, ObjType.Task, Action.Create, this.#parent)
        await this.update()
    }

    get task_type(): string { return this.#task_type }
    get status(): TaskStatus | undefined {
        return this.#task?.status
    }
    get running(): boolean {
        return this.status && !['completed', 'faulted'].includes(this.status)
    }

    async start() {
        await this.model.saveNew({id: this.#parent.id, name: ''}, {type: this.#task_type})
    }
}

export class CorrectionVm extends TaskVm {
    constructor(borehole: any, onFinish?: () => Promise<void>) {
        super(TaskType.correction, borehole, onFinish)
    }
}
