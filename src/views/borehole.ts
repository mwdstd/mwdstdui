import m from 'mithril'
import { Button, Collection, CollectionMode, FileInput, Tabs } from 'mithril-materialized'
import { actButton, actButtonSm, breadcrumbs } from './common'
import { readTextFileAsync } from '../utils'
import { TextEdit, FloatEdit, DateEdit } from '../components/common'
import { DataGrid } from '../datagrid'
import { Stepper } from '../stepper'
import { fieldClass, descriptionSelector } from './common'
import { GeomagValues } from '../enums'
import { BoreholePropertiesCard, addPropertiesColumn } from './properties'
import { QuickReportView } from './borehole/quickreport'
import { finalizeModal, runsListWorkflow } from './borehole/workflow'
import { BoreholeEditVm, BoreholeNewVm, BoreholeViewVm } from '../viewmodels/borehole'
import { BoreholeInfo } from '../types'
import { GeometryTab } from './borehole/geometry'
import { fdg, fh } from '../units'
import { mdColumn } from '../components/columns'
import { GeometryGrid } from '../components/geometry'


var BoreholeWorkflowView = {
    view: function (vnode: m.Vnode<{model: BoreholeViewVm}>) {
        var model = vnode.attrs.model
        var obj = model.obj;
        // if(!obj) return []
        return [
            breadcrumbs(model),
            //headerWorkflow(obj, model),
            addPropertiesColumn(m(Tabs, {
                tabs: [
                    {
                        title: 'Runs',
                        vnode: runsListWorkflow(obj, model)
                    },
                    {
                        title: 'Quick report',
                        vnode: m(QuickReportView, {model: model}),
                    },
                    ...model.checkTag('wellbore_geometry') != null? [
                        {
                            title: 'Wellbore geometry',
                            vnode: GeometryTab(model),
                        },
                        ] : [],
                ]   
            }), BoreholePropertiesCard(model, obj), obj.well),
            finalizeModal(model)
        ]
    }
}

var BoreholeManualView = {
    view: function (vnode: m.Vnode<{model: BoreholeViewVm}>) {
        var model = vnode.attrs.model
        var obj = model.obj;
        // if(!obj) return []
        return [
            breadcrumbs(model),
            addPropertiesColumn(
            m(Tabs, {
                tabs: [
                    {
                        title: 'Runs',
                        vnode: m(Collection, {
                                    header: model.newRun.hide?.() ? '' : m('.right-align', [
                                        m(Button, {
                                            label: "Import",
                                            iconName: "upload",
                                            onclick: () => { model.importRun() },
                                            disabled: obj.runs.some(o => o.active),
                                        }),
                                        actButton(model.newRun, {className: 'left'}),
                                    ]) as unknown as string,
                                    mode: CollectionMode.LINKS,
                                    items: obj.runs.map((o, i) => (
                                        { 
                                            title: m('', 
                                                m('span', o.name + (o.active ? ' (active)' : '')),
                                                obj.active && i == obj.runs.length - 1 ?
                                                actButtonSm(model.toggleActiveRun(o), {style: 'margin-top:-6px', className: 'right blue black-text lighten-4'})
                                                 : ''
                                            ), 
                                            href: model.child_path(o.id), 
                                            active: o.active,
                                        }))
                                }),
                    },
                    {
                        title: 'Quick report',
                        vnode: m(QuickReportView, {model: model}),
                    },
                    ...model.checkTag('wellbore_geometry') != null? [
                        {
                            title: 'Wellbore geometry',
                            vnode: GeometryTab(model),
                        },
                    ] : [],
                ]   
            }), BoreholePropertiesCard(model, obj), obj.well)
        ]
    }
}

export var BoreholeView = {
    view: function (vnode: m.Vnode<{model: BoreholeViewVm}>) {
        return !vnode.attrs.model?.obj ? [] : m(vnode.attrs.model.obj?.well.data_mode == 'manual' ? BoreholeManualView : BoreholeWorkflowView, vnode.attrs)
    }
}

var editSteps = (item: BoreholeInfo, model: BoreholeEditVm | BoreholeNewVm, geomag: string) => [
    {
        title: 'Basic information',
        content: [
            m('.row.valign-wrapper', [
                m(TextEdit, {
                    autofocus: true,
                    label: 'Borehole name',
                    item, field: 'name',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Name used for display and search. Must be unique within well'),
            ]),
            m('.row.valign-wrapper', [
                m(FloatEdit, {
                    label: fh('Start depth', model.user.us.length),
                    item, field: 'kick_off',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Current start drilling depth'),
            ]),
            m('.row.valign-wrapper', [
                m(FloatEdit, {
                    required: true,
                    label: fh('RKB elevation', model.user.us.length),
                    className: fieldClass,
                    item, field: 'rkb_elevation',
                }),
                m(descriptionSelector, 'RKB elevation above wellhead'),
            ]),
            m('.row.valign-wrapper', [
                m(DateEdit, {
                    required: true,
                    label: 'Start date',
                    className: fieldClass,
                    item, field: 'start_date',
                }),
                m(descriptionSelector, 'Drilling start date. Used in automatic reference calculation'),
            ])
        ]
    },
    ...(geomag != 'wmm' && geomag != 'emm') ? [{
        title: 'Geomag reference',
        content: (geomag == 'bggm' || geomag == 'hdgm') ? 
            [
                m.trust(`<p>Please specify wellhead geomagnetic reference provided by your 
                    <b>${GeomagValues[geomag]}</b> software</p>`),
                m('.row.valign-wrapper', [
                    m(FloatEdit, {
                        label: fh('B', model.user.us.magind),
                        item: item?.ref_head || {}, field: 'b',
                        required: true,
                        className: 'col s4 m2',
                    }),
                    m(FloatEdit, {
                        label: fh('Dip', model.user.us.angle),
                        item: item?.ref_head || {}, field: 'dip',
                        required: true,
                        className: 'col s4 m2',
                    }),
                    m(FloatEdit, {
                        label: fh('Declination', model.user.us.angle),
                        item: item?.ref_head || {}, field: 'dec',
                        required: true,
                        className: 'col s4 m2',
                    }),
                    m(descriptionSelector, ''),
                ]),
            ]
            : (geomag == 'ifr1' || geomag == 'ifr2') ? [
                    m('.fill', [
                        m.trust(`<p>Please provided geomagnetic reference computed by your 
                        <b>${GeomagValues[geomag]}</b> software</p>`),
                        m(FileInput, {
                            placeholder: 'Import reference from JSON',
                            multiple: false,
                            accept: ['.json'],
                            onchange: async (files) => {
                                var ref;
                                try {
                                    var text = await readTextFileAsync(files[0])
                                    ref = JSON.parse(text)
                                } catch {
                                    return
                                }
                                item.ref_traj = ref
                            },
                        }),
                        m(DataGrid, {
                            editable: true,
                            columns: [
                                mdColumn(model.user.us),
                                { ...fdg('B', model.user.us.magind), name: 'b', type: 'float' },
                                { ...fdg('Dip', model.user.us.angle), name: 'dip', type: 'float' },
                                { ...fdg('Dec', model.user.us.angle), name: 'dec', type: 'float' },
                            ],
                            items: item.ref_traj ?? []
                        }),
                    ])                
                ] : ''
    }] : [],
    ...!model.isManualMode() && model.checkTag('wellbore_geometry') != null ? [
    {
        title: 'Wellbore geometry',
        content: m('.fill', 
            m(FileInput, {
                placeholder: 'Import geometry from WITSML or JSON',
                multiple: false,
                accept: ['.json', '.xml'],
                onchange: async (files) => {
                    await model.loadGeometry(files[0])
                },
            }),
            GeometryGrid(item.geometry, model.user.us, true)
        )
    },
    ] : [],
]

export var BoreholeNew = {
    view: (vnode: m.Vnode<{model: BoreholeNewVm}>) => [
        m(Stepper, {
            linear: true,
            steps: editSteps(vnode.attrs.model.obj, vnode.attrs.model, vnode.attrs.model.parent.geomag)
        })
    ]
}

export var BoreholeEdit = {
    view: (vnode: m.Vnode<{model: BoreholeEditVm}>) => !vnode.attrs.model?.obj ? [] : [
        m(Stepper, {
            editMode: true, 
            steps: editSteps(vnode.attrs.model.obj, vnode.attrs.model, vnode.attrs.model.obj.well.geomag)
        })
    ]
}
