export interface NamedObject{
    name: string
}
export interface DbObject {
    id: string
    name: string | null
}
export interface ClientInfo extends NamedObject {
}
export interface ClientDb extends ClientInfo, DbObject {}
export interface Client extends PadDb {
    oilfields: OilfieldDb[]
}

export interface OilfieldInfo extends NamedObject {
    lat: number
    lon: number
}
interface OilfieldParents {client: ClientDb}
export interface OilfieldDb extends OilfieldInfo, DbObject {}
export interface Oilfield extends OilfieldDb, OilfieldParents {
    pads: PadDb[]
}

export interface PadInfo extends NamedObject {
    lat: number
    lon: number
    type: "land" | "offshore"
    date_start: string
    date_finish: string
}
interface PadParents extends OilfieldParents {field: OilfieldDb}
export interface PadDb extends PadInfo, DbObject {}
export interface Pad extends PadDb, PadParents {
    wells: WellDb[]
}

export interface WellInfo extends NamedObject {
    lat: number
    lon: number
    alt: number
    north_type: "true" | "grid"
    grid: "manual" | "wgs84"
    grid_value: number
    grav: "manual" | "igf80"
    grav_value: number
    geomag: string
    data_mode: "manual" | "workflow"
    maintenance_mode: boolean
    service_level: 1 | 2 | 3
    fes: User[]
}
export interface WellDb extends WellInfo, DbObject {}
interface WellParents extends PadParents {pad: PadDb}
export interface WellShort extends WellDb, WellParents {}
export interface Well extends WellShort {
    boreholes: BoreholeDb[]
}

export interface BoreholeInfo extends NamedObject {
    kick_off: number
    rkb_elevation: number
    start_date: string
    interference_intervals: {start: number, stop: number}[]
    geometry: any[]
    ref_head: any
    ref_traj: any
}
export interface BoreholeDb extends BoreholeInfo, DbObject {
    last_depth?: number;
    active: boolean
}
export interface BoreholeParents extends WellParents {well: WellDb}
export interface Borehole extends BoreholeDb, BoreholeParents {
    runs: RunDb[]
    last_plan?: Plan
    geometry_finished: GeometrySection[]
}

export enum TaskStatus {
    scheduled = 'scheduled',
    running = 'running',
    completed = 'completed',
    canceled = 'canceled',
    faulted = 'faulted'
}

export enum TaskType {
    correction = 'correction',
    fusion = 'fusion',
    decunc = 'decunc'
}

export interface Task {
    id: string
    parent_id: string
    type: TaskType
    status: TaskStatus
}

interface PlanBase {
    revision: number, 
    uploaded?: string
}

export interface PlanInfo extends PlanBase {
    length: number
}

export interface Plan extends PlanBase {
    stations: Station[]
}

export interface QaFlag {
    name: string
    value?: boolean
    severity?: number
}
export interface Qa {
    [key: string] : QaFlag
}

export interface Correction {
    apst_unc: any
    dni_cs: any
    ref_cs: any
    ref_unc: any
    qa: Qa
    sag?: number[]
    stations?: any[]
    stations_hd?: Station[]
    stations_proj?: Station[]
    stations_unc?: Station[]
    surveys: CorrectedSurvey[]
    deepest?: Station
    plan_dev?: Station
}

export interface RunInfo extends NamedObject {
    bha: any
    tool: {name: string, sn: string, dni: {name: string, sn: string}, tf_correction: number}
    mud_weight: number
    geometry: GeometrySection[]
    plan: Plan
}

export interface RunDb extends RunInfo, DbObject {
    correction: {result?: Correction}
    active: boolean
}
interface RunParents extends BoreholeParents {borehole: BoreholeDb}
export interface Run extends RunDb, RunParents {
    surveys: SurveyDb[]
    ci: CiStation[]
    stations: Station[]
    head_ref: Reference
    reference: Reference[]
    status_msa: boolean
    status_auto: boolean
    status_multi: boolean
}

export interface RefParams {
    g: number
    b: number
    dip: number
}

export interface Reference extends RefParams {
    dec: number
    grid: number
}

export interface SurveyInfo {
    md: number
    bx: number
    by: number
    bz: number
    gx: number
    gy: number
    gz: number
    pre_qc: boolean
    time: Date
}
export interface SurveyDb extends SurveyInfo, DbObject {
    visible: boolean
}
interface SurveyParents extends RunParents {run: RunDb}
export interface Survey extends SurveyDb, SurveyParents {
}

export interface QcParams extends RefParams {
    inc?: number
    az?: number
}

interface Qc {
    g: boolean
    b: boolean
    dip: boolean
    inc?: boolean
    az?: boolean
}

interface Position {
    tvd: number
    ns: number
    ew: number
}

export interface PlanDeviation extends Position{
    inc: number
    az: number
}

export interface CorrectedSurvey extends SurveyInfo {
    qc: number
    min: QcParams
    max: QcParams
    qc_pass?: Qc
    az_pass?: boolean
    inc_pass?: boolean
}

export interface CiStation {
    md: number
    inc: number
}

export interface Station extends CiStation {
    az: number
    tf?: number
    tvd?: number
    ns?: number
    ew?: number
    dls?: number
}

export interface SlideInterval {
    md_start: number
    md_stop: number
    mode: "tangent" | "curve"
    tf_mode?: "gtf" | "mtf"
    tf_value?: number
    steer_ratio?: number
}

export interface GeometrySection {
    hole_diameter: number
    casing_start?: number
    casing_stop?: number
    casing_inner_diameter?: number
    description?: string
}

export interface LegProgram {
    md_start: number
    md_stop: number
    toolcode: string
}

export interface SurveyLeg {
    stations: Station[]
    toolcode: string
}

export interface ActiveRunInfo {
    client: ClientDb
    field: OilfieldDb
    pad: PadDb
    well: WellDb
    borehole: BoreholeDb
    run: RunDb
    correction: {result?: Correction}
    plan?: PlanInfo
}

export enum UserRole {
    SU = 'su',
    DE = 'de',
    FE = 'fe',
    CR = 'cr',
    None = 'null'
}

type Permutation<T, C = T> = [T] extends [never]
    ? []
    : C extends infer U
    ? [U, ...Permutation<Exclude<T, U>>]
    : [];

export type AxisMap = Permutation<'X'|'Y'|'Z'>
export type AxisInv = [boolean, boolean, boolean]

export interface UnitSystem {
    acceleration: string,
    angle: string,
    density: string,
    diameter: string,
    length: string,
    mass: string,
    magind: string, 
    temperature: string,
    ratio: string
    ratio_fine: string
    dls_interval: number
    gaxes: AxisMap
    maxes: AxisMap
    gaxesi: AxisInv
    maxesi: AxisInv
}

export interface User extends DbObject {
    login: string
    role?: UserRole
    oilfields: string[]
    well: string
    client: string
    us: UnitSystem
}
