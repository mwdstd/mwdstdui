import m from 'mithril'
import { FileInput } from 'mithril-materialized'
import { DataColumn, DataGrid } from '../datagrid'
import { BhaComponentTypeValues, MaterialValues } from '../enums'
import { hasBend, hasMwd } from '../typehelpers'
import { UnitSystem } from '../types'
import { fdg, fv } from '../units'
import { RunEditVm, RunNewVm } from '../viewmodels/run'
import { descriptionColumn } from './columns'


interface IBhaAttrs {
    bha: any
    us: UnitSystem
}

interface IBhaEditAttrs extends IBhaAttrs {
    model: RunEditVm | RunNewVm
}

const odColumn = (us: UnitSystem) => (<DataColumn>{ ...fdg('OD', us.diameter), name: 'od', type: 'float' })
const idColumn = (us: UnitSystem) => (<DataColumn>{ ...fdg('ID', us.diameter), name: 'id', type: 'float' })
const typeColumn = <DataColumn>{ label: 'Type', name: 'type', type: 'enum', values: BhaComponentTypeValues }
const snColumn = { label: 'SN', name: 'sn', optional: true }
const lengthColumn = (us: UnitSystem) => (<DataColumn>{ ...fdg('Length', us.length), name: 'length', type: 'float' })
const weightColumn = (us: UnitSystem) => (<DataColumn>{ ...fdg('Weight', us.mass), name: 'weight', type: 'float' })
const materialColumn = <DataColumn>{ label: 'Material', name: 'material', type: 'enum', values: MaterialValues }

const BhaStructureGrid = (structure: any[], us: UnitSystem, editable: boolean = false) => m(DataGrid, {
    editable,
    columns: [ 
        typeColumn, descriptionColumn, snColumn, odColumn(us), idColumn(us), lengthColumn(us), 
        weightColumn(us), materialColumn
    ],
    items: structure
})

export const BhaBladesGrid = (blades: any[], us: UnitSystem, editable: boolean = false) => m(DataGrid, {
    editable,
    columns: [
        odColumn(us),
        { ...fdg('Center to bit', us.length), name: 'center_to_bit', type: 'float' },
        { ...fdg('Length', us.length), name: 'length', type: 'float' },
    ],
    items: blades
})


export const BhaView = () => {
    return {
        view: (vnode: m.Vnode<IBhaAttrs>) => {
            const { bha, us } = vnode.attrs
            return [
            BhaStructureGrid(bha.structure, us),
            m('h5', 'Blades'),
            BhaBladesGrid(bha.blades, us),
            ...hasBend(bha) ? [
                m('h5', 'Bend'),
                m(DataGrid, {
                    columns: [
                        { ...fdg('Bend to bit', us.length), name: 'bend_to_bit', type: 'float' },
                        { ...fdg('Bend angle', us.angle), name: 'bend_angle', type: 'float' },
                    ],
                    items: [bha]
                }),
            ] : [],
            ...hasMwd(bha) ? [
                m('h5', `TF correction ${fv(bha.tf_correction, us.angle)}`),
                m('h5', `D&I to bit: ${fv(bha.dni_to_bit, us.length)}`)
            ] : [],
        ]
        }
    }
}

export const BhaEdit = () => {
    return {
        view: (vnode: m.Vnode<IBhaEditAttrs>) => {
            const us = vnode.attrs.us
            return m('.fill',
                m(FileInput, {
                    placeholder: 'Import BHA from WITSML or JSON',
                    multiple: false,
                    accept: ['.json', '.xml'],
                    onchange: async (files) => {
                        await vnode.attrs.model.loadBha(files[0])
                    },
                }),
                BhaStructureGrid(vnode.attrs.bha.structure, us, true),
            )
        }
    }
}