import { DataColumn } from "../datagrid"
import { SlideModeValues, TfModeValues } from "../enums"
import { UnitSystem } from "../types"
import { fdg } from "../units"


export const descriptionColumn = { label: 'Description', name: 'description', optional: true }

export const mdColumn = (us: UnitSystem) => (<DataColumn>{ ...fdg('MD', us.length), name: 'md', type: 'float' })
export const incColumn = (us: UnitSystem) => (<DataColumn>{ ...fdg('Inc', us.angle), name: 'inc', type: 'float' })
export const azColumn = (us: UnitSystem) => (<DataColumn>{ ...fdg('Az', us.angle), name: 'az', type: 'float' })

export const startDepthColumn = (us: UnitSystem) => 
    (<DataColumn>{ ...fdg('Start Depth', us.length), name: 'md_start', type: 'float'})
export const stopDepthColumn = (us: UnitSystem) => 
    (<DataColumn>{...fdg('Stop Depth', us.length), name: 'md_stop', type: 'float'})
export const slideModeColumn = 
    (<DataColumn>{label: 'Mode', name: 'mode', type: 'enum', values: SlideModeValues})
export const tfModeColumn = 
    (<DataColumn>{label: 'TF Mode', name: 'tf_mode', type: 'enum', values: TfModeValues})
export const tfValueColumn = (us: UnitSystem) => 
    (<DataColumn>{...fdg('TF Value', us.angle), name: 'tf_value', type: 'float'})
export const steerRatioColumn = (us: UnitSystem) => 
    (<DataColumn>{...fdg('Steer Ratio', us.ratio), name: 'steer_ratio', type: 'float'})
