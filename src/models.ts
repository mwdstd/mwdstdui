import conf from './config'
import {ActiveRunInfo, Borehole, BoreholeInfo, Correction, DbObject, Oilfield, Pad, Run, RunInfo, SlideInterval, Survey, SurveyInfo, UnitSystem, User, UserRole, Well, WellDb, WellInfo} from './types'
import { makeRequest } from './net';



class NetworkModel {
    protected async base_url() {
        return (await conf).apiUrl
    }
}

export class Model extends NetworkModel{
    name: string
    parent_name: string
    constructor(name: string, parent_name?: string) {
        super()
        this.name = name
        this.parent_name = parent_name
    }

    protected async getListUrl(parent_id: string) { return parent_id ? `${await this.base_url()}/${this.parent_name}/${parent_id}/${this.name}` : `${await this.base_url()}/${this.name}/` }
    protected async getSingleUrl(id: string) { return `${await this.base_url()}/${this.name}/${id}` }
    async loadList(parent_id?: string): Promise<any[]> {
        return await makeRequest("GET", await this.getListUrl(parent_id))
    }
    async load(id: string): Promise<any> {
        return await makeRequest("GET", await this.getSingleUrl(id))
    }
    async export(id: string) {
        return await makeRequest("GET", `${await this.base_url()}/export/${this.name}/${id}`)
    }
    async save(obj: DbObject) {
        return makeRequest("PUT", await this.getSingleUrl(obj.id), obj)
    }
    async delete(obj: DbObject) {
        await makeRequest("DELETE", await this.getSingleUrl(obj.id))
    }
    async saveNew(parent: DbObject | null, obj: any): Promise<string> {
        return makeRequest("POST", await this.getListUrl(parent?.id), obj)
    }
    createNew(parent?: DbObject | null) {
        return {}
    }
}

class ClientModelClass extends Model {
    createNew() {
        return {services: {mmsa: {enabled: false}, iec: {enabled: false}, sag: {enabled: false}, depth: {enabled: false}, rtac: {enabled: false}}}
    }
}

class PadModelClass extends Model {
    createNew(parent: Oilfield) {
        return {}
    }
}

class WellModelClass extends Model {
    createNew(parent: Pad) {
        return {data_mode: 'workflow'}
    }
}

class BoreholeModelClass extends Model {
    createNew(parent: Well) {
        return {well: parent, sections: [], plan: [], interference_intervals: [], geometry: [], ref_head: {}, ref_traj: []}
    }
    cleanRef(parent: WellInfo, obj: BoreholeInfo) {
        if(['wmm', 'emm'].includes(parent.geomag)) {
            obj.ref_head = undefined
            obj.ref_traj = undefined
        } else if(['hdgm', 'bggm'].includes(parent.geomag)) {
            obj.ref_traj = undefined
        } else {
            obj.ref_head = undefined
        }
    }
    async saveNew(parent: Well, obj: Borehole) {
        this.cleanRef(parent, obj)            
        return super.saveNew(parent, obj)
    }
    async save(obj: Borehole) {
        this.cleanRef(obj.well, obj)            
        await super.save(obj)
    }
    async saveGyro(obj: Borehole, gyro) {
        await makeRequest("PUT", `${await this.getSingleUrl(obj.id)}/gyro`, gyro)
    }
    async setActive(borehole_id: string, active: boolean) {
        await makeRequest("PUT", `${await this.getSingleUrl(borehole_id)}/active`, active)
    }
}

class RunModelClass extends Model {
    async load(id: string, filter: boolean = true): Promise<any> {
        return await makeRequest("GET", `${await this.getSingleUrl(id)}${!filter ? '?filter=false' : ''}`)
    }
    createNew() {
        return {tool: {dni: {}}, bha: {structure: [], blades: []}, plan: {revision: undefined, stations: []}}
    }
    async saveCi(run: Run, ci) {
        await makeRequest("PUT", `${await this.getSingleUrl(run.id)}/ci`, ci)
    }
    async saveSurveys(run: Run, ci) {
        await makeRequest("PUT", `${await this.getSingleUrl(run.id)}/surveys`, ci)
    }
    async savePlan(run: Run, plan) {
        await makeRequest("PUT", `${await this.getSingleUrl(run.id)}/plan`, plan)
    }
    async setActive(run_id: string, active: boolean) {
        await makeRequest("PUT", `${await this.getSingleUrl(run_id)}/active`, active)
    }
}

class SurveyModelClass extends Model {
    createNew() {
        return {time: new Date(), pre_qc: true}
    }
}

class TasksModelClass extends Model {
    async getListUrl(parent_id?: string) { return parent_id ? `${await this.base_url()}/${this.name}/?parent_id=${parent_id}` : `${await this.base_url()}/${this.name}/` }
    async saveNew(parent: DbObject | null, obj: any): Promise<string> {
        return makeRequest("POST", `${await this.getListUrl(parent?.id)}&type=${obj.type}`, {})
    }
    async exportRequest(id: string) {
        return makeRequest("GET", `${await this.getSingleUrl(id)}/request`)
    }
}

class UserModelClass extends Model {
    constructor() {
        super("users")
        document.addEventListener('tokenchange', () => {this.me = null})
    }
    me: User
    async loadMe() {
        if (this.me) return this.me
        this.me = await makeRequest("GET", `${await this.base_url()}/users/me`)
        return this.me
    }
    async setMyUs(us: UnitSystem) {
        await makeRequest("PUT", `${await this.base_url()}/users/me/us`, us)
    }
    async changeMyPassword(old_password: string, new_password: string) {
        await makeRequest("PUT", `${await this.base_url()}/users/me/pass`, {old_password, new_password})
    }
    async load(id: string): Promise<any> {
        let user = await super.load(id)
        user.role = user.role ?? UserRole.None
        return user
    }
    async setRole(user_id: string, role: UserRole) {
        role = (role == UserRole.None ? null : role)
        return await makeRequest("PUT", `${await this.base_url()}/users/${user_id}/role`, role)
    }
    async setClient(user_id: string, object_id: string ) {
        return await makeRequest("PUT", `${await this.base_url()}/users/${user_id}/client`, object_id)
    }
    async setOilfields(user_id: string, field_ids: string[] ) {
        return await makeRequest("PUT", `${await this.base_url()}/users/${user_id}/fields`, field_ids)
    }
    async setWell(user_id: string, object_id: string ) {
        return await makeRequest("PUT", `${await this.base_url()}/users/${user_id}/well`, object_id)
    }
}

class WorkflowModel extends NetworkModel {

    async finalizeBorehole(borehole: Borehole) {
        await makeRequest("PUT", `${await this.base_url()}/workflow/${borehole.well.id}/borehole/finalized`)
    }

    async finalizeRun(run: Run) {
        await makeRequest("PUT", `${await this.base_url()}/workflow/${run.well.id}/run/finalized`)
    }

    async newBorehole(well: Well, borehole: BoreholeInfo) {
        BoreholeModel.cleanRef(well, borehole)
        return await makeRequest<string>("POST", `${await this.base_url()}/workflow/${well.id}/borehole`, borehole)
    }

    async newRun(borehole: Borehole, run: RunInfo) {
        return await makeRequest<string>("POST", `${await this.base_url()}/workflow/${borehole.well.id}/run`, run)
    }

    async newSurvey(run: Run, survey) {
        return await makeRequest<string>("POST", `${await this.base_url()}/workflow/${run.well.id}/survey?calc=true`, survey)
    }

    async undoSurvey(sid: string) {
        return await makeRequest("DELETE", `${await this.base_url()}/workflow/survey/${sid}`)
    }
}

class SurveyControlModel extends NetworkModel {
    async load() {
        return await makeRequest<ActiveRunInfo[]>("GET", `${await this.base_url()}/control/list/`)
    }
    async manualCorrection(run: Run, options: CorrectionOptions, sag: number[]) {
        return await makeRequest<Correction>("POST", `${await this.base_url()}/rpc/mcorrect`, {
            dni_cs: options.dni_cs,
            surveys: run.surveys.filter((o, i) => options.filter[i]),
            reference: run.reference.filter((o, i) => options.filter[i]),
            sag: sag.filter((o, i) => options.filter[i])
            // run.correction.result?.sag?.filter((o, i) => options.filter[i])
        })
    }
    async manualCorrectionSingle(run: Run, dni_cs: any, survey: SurveyInfo) {
        return await makeRequest<Correction>("POST", `${await this.base_url()}/rpc/mcorrect`, {
            dni_cs,
            //ref_cs: run.correction.result.ref_cs,
            surveys: [...run.surveys, survey],
            reference: [...run.reference, run.reference.slice(-1)[0] ?? run.head_ref],
            geomag: run.well.geomag, 
            bha: run.bha?.structure?.length > 0 ? run.bha : null,
        })
    }
    async filteredCorrection(run: Run, options: CorrectionOptions) {
        return await makeRequest<Correction>("POST", `${await this.base_url()}/rpc/fcorrect/${run.id}`, options)
    }
    async saveCorrection(run: Run, options: CorrectionOptions) {
        return await makeRequest("POST", `${await this.base_url()}/rpc/runopts/${run.id}`, options)
    }
    async setMaintenanceMode(well: WellDb, value: boolean) {
        return await makeRequest("PUT", `${await this.base_url()}/wells/${well.id}/maintenance`, value)
    }
}

export class CorrectionOptions {
    constructor(run: Run) {
        this.filter = run.surveys.map(s => s.visible);
        const cr = run.correction?.result
        this.status_msa = cr ? run.status_msa : false
        this.status_auto = cr ? run.status_auto : false
        this.status_multi = cr ? run.status_multi : false
        this.dni_cs = cr ? {...run.correction.result.dni_cs} : {
            ABX: 0,
            ABY: 0,
            ABZ: 0,
            ASX: 0,
            ASY: 0,
            ASZ: 0,
            MBX: 0,
            MBY: 0,
            MBZ: 0,
            MSX: 0,
            MSY: 0,
            MSZ: 0,
            MXY: 0,
            MXZ: 0,
            MYZ: 0,
        }
    }
    filter: boolean[] = []
    status_msa: boolean = true
    status_auto: boolean = true
    status_multi: boolean = false
    dni_cs: any
}

//Models
export var ClientModel = new ClientModelClass("clients")
export var OilfieldModel = new Model("fields", "clients")
export var PadModel = new PadModelClass("pads", "fields")
export var WellModel = new WellModelClass("wells", "pads")
export var BoreholeModel = new BoreholeModelClass("boreholes", "wells")
export var RunModel = new RunModelClass("runs", "boreholes")
export var SurveyModel = new SurveyModelClass("surveys", "runs")
export var TasksModel = new TasksModelClass("tasks")
export var Workflow = new WorkflowModel()
export var SurveyControl = new SurveyControlModel()
export var UserModel = new UserModelClass()
