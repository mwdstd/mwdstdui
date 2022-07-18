import m from 'mithril'
import { Button, Collapsible, FlatButton } from 'mithril-materialized'
import { azColumn, incColumn, mdColumn } from '../../components/columns'
import { CorStationsGrid, StationsGrid } from '../../components/stations'
import { DataGrid } from '../../datagrid'
import { Run } from '../../types'
import { fdg } from '../../units'
import { RunViewVm } from '../../viewmodels/run'
import { actButton } from '../common'
import { qc_flags, qc_group_tiles } from '../qc'

export const qcNames = ['STD', 'INC_ONLY', 'BAD']

const buttons = (obj: Run, model: RunViewVm) => m('',
    actButton(model.newSurvey, {className: 'left input-field'}),
    actButton(model.undoLastSurvey, {className: 'left input-field'}),
    m(Button, {label: 'Export', iconName: "download", className: 'right input-field', onclick: () => {model.exportData('6-axis', obj.surveys.map(s => {let {['id']: val, ...ss} = s; return ss }))}}),
    actButton(model.importSurveys, {className: 'right input-field'})
)
const raw_surveys = (obj: Run, model: RunViewVm, show_buttons: boolean = true) => m(DataGrid, {
    columns: [
        {label: 'Pre-QC', name: 'pre_qc', type: 'bool'},
        mdColumn(model.user.us),
        {...fdg('Gx', model.user.us.acceleration), name: 'gx', type: 'float'},
        {...fdg('Gy', model.user.us.acceleration), name: 'gy', type: 'float'},
        {...fdg('Gz', model.user.us.acceleration), name: 'gz', type: 'float'},
        {...fdg('Bx', model.user.us.magind), name: 'bx', type: 'float'},
        {...fdg('By', model.user.us.magind), name: 'by', type: 'float'},
        {...fdg('Bz', model.user.us.magind), name: 'bz', type: 'float'},
        {label: 'Time', name: 'time', type: 'time'},
        ...model.checkTag('temp') != null ? [
            {...fdg('Temperature', model.user.us.temperature), name: 'temp', type: <const>'float'}
        ] : [],
        ...model.checkTag('ds_weight') != null ? [
            {...fdg('PU Weight', model.user.us.mass), name: 'ds_weight_up', type: <const>'float'},
            {...fdg('SO Weight', model.user.us.mass), name: 'ds_weight_down', type: <const>'float'},
            {...fdg('Rot Weight', model.user.us.mass), name: 'ds_weight_rot', type: <const>'float'},
        ] : [],
        ...show_buttons && model.isManualMode() && !model.importSurveys.hide() ? 
        [{label: '', type: <const>'template', viewTemplate: (item) => m('[style=min-width:110px]',[
            m(FlatButton, {iconClass: 'center', iconName: 'edit', 
                onclick: async () => {await model.editSurvey(item)}}),
            m(FlatButton, {iconClass: 'center', iconName: 'delete', 
                onclick: async () => {await model.deleteSurvey(item)}}),
        ])}] : [],
    ],
    items: obj.surveys
})

const raw_stations = (obj: Run, model: RunViewVm) => m(DataGrid, {
    columns: [
        mdColumn(model.user.us), incColumn(model.user.us), azColumn(model.user.us),
        {...fdg('TF', model.user.us.angle), name: 'tf', type: 'float'},
        {...fdg('G', model.user.us.acceleration), name: 'tg', type: 'float'},
        {...fdg('B', model.user.us.magind), name: 'tb', type: 'float'},
        {...fdg('Dip', model.user.us.angle), name: 'dip', type: 'float'},
    ],
    items: model.raw_stations || []
})

const cor_stations = (obj: Run, model: RunViewVm) => CorStationsGrid(model.cor_stations, model.user.us)

const hd_stations = (obj: Run, model: RunViewVm) => StationsGrid(obj.correction?.result?.stations_hd || [], model.user.us)

export const SurveysTab = (obj: Run, model: RunViewVm, show_buttons: boolean = true) => m('',
    show_buttons ?  buttons(obj, model) : '',
    m('.row'),
    m(Collapsible, {
        items: [
            {
                header: 'Raw 6-axis',
                body: raw_surveys(obj, model, show_buttons)
            },
            {
                header: 'Raw stations',
                body: raw_stations(obj, model)
            },
            ...model.cor_stations ? [{
                header: 'Corrected stations', 
                body: cor_stations(obj, model)
            }] : [],
            ...obj.correction?.result?.stations_hd ? [{
                header: 'HD stations', 
                body: hd_stations(obj, model)
            }] : [],
            ...obj.correction?.result ? [{
                header: m('', {style: 'width: 100%'}, 
                    m('.col.s3[style=padding:0px]', 'QC flags'), 
                    qc_group_tiles('.col.s1.red.center-align.lighten-4', model.qa.groups)
                ),
                body: model.qa.issues.length > 0 ? 
                    m('ul.browser-default', model.qa.issues.map(is => m('li', is))) : 
                    m('', 'No issues detected')
            }] : [],
        ]
    })
) 
