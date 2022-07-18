import m from 'mithril'
import { Button, FileInput, Tabs } from 'mithril-materialized'
import {fieldClass, descriptionSelector, breadcrumbs} from './common'
import {TextEdit, FloatEdit, BoolEdit} from '../components/common'
import {Stepper} from '../stepper'
import {BhaView, BhaEdit, BhaBladesGrid} from '../components/bha'
import {RunPropertiesCard, addPropertiesColumn} from './properties'
import {ChartsTab} from './run/charts'
import {SurveysTab} from './run/surveys'
import { RunEditVm, RunNewVm, RunViewVm } from '../viewmodels/run'
import { RunInfo } from '../types'
import { PlanView, PlanUpload, PlanUploadModal } from './run/plan'
import { CiTab } from './run/ci'
import { GeometryTab } from './run/geometry'
import { GeometryGrid } from '../components/geometry'
import { fh } from '../units'
import { hasBend, hasMwd } from '../typehelpers'


var RunWorkflowView = {
    view: function(vnode: m.Vnode<{model: RunViewVm}>) {
        var model = vnode.attrs.model
        var obj = model.obj;
        return [
            breadcrumbs(model),
            addPropertiesColumn(
            m(Tabs, {
                tabs: [ 
                    {
                        title: 'Surveys',
                        vnode: SurveysTab(obj, model)
                    },
                    ...model.checkTag('ci') ? [
                    {
                        title: 'CI',
                        vnode: CiTab(model),
                    },
                    ] : [],
                    {
                        title: 'Charts',
                        vnode: ChartsTab(model.obj, model.user.us),
                    },
                    ...model.checkTag('bha') ? [
                    {
                        title: 'BHA',
                        vnode: m.fragment({}, [
                            m(Button, {label: 'Export', iconName: "download", className: 'right input-field', onclick: () => {model.exportData('BHA', obj.bha)}}),
                            m(BhaView, {bha: obj.bha, us: model.user.us})
                        ])
                    }] : [],
                    ...obj.geometry && obj.geometry.length > 0? [
                    {
                        title: 'Wellbore geometry',
                        vnode: GeometryTab(obj, model)
                    }] : [],
                    {
                        title: 'Plan',
                        vnode: PlanView(model),
                    },

                ]
            }), RunPropertiesCard(model, obj), obj.well)
        ]
    }
}

var RunManualView = {
    view: function(vnode: m.Vnode<{model: RunViewVm}>) {
        var model = vnode.attrs.model
        var obj = model.obj;
        return [
            breadcrumbs(model),
            addPropertiesColumn(
            m(Tabs, {
                tabs: [ 
                    {
                        title: 'Surveys',
                        vnode: SurveysTab(obj, model)
                    },
                    ...model.checkTag('ci') ? [
                    {
                        title: 'CI',
                        vnode: CiTab(model)
                    },
                    ] : [],
                    {
                        title: 'Charts',
                        vnode: ChartsTab(model.obj, model.user.us),
                    },
                    ...model.checkTag('bha') ? [
                    {
                        title: 'BHA',
                        vnode: m.fragment({}, [
                            m(Button, {label: 'Export', iconName: "download", className: 'right input-field', onclick: () => {model.exportData('BHA', obj.bha)}}),
                            m(BhaView, {bha: obj.bha, us: model.user.us})
                        ])
                    }] : [],
                    ...obj.geometry && obj.geometry.length > 0? [
                    {
                        title: 'Wellbore geometry',
                        vnode: GeometryTab(obj, model)
                    }] : [],
                    {
                        title: 'Plan',
                        vnode: PlanView(model),
                    },
                ]
            }), RunPropertiesCard(model, obj), obj.well),
            m(PlanUploadModal, {model})
        ]
    }
}

export var RunView = {
    view: function (vnode: m.Vnode<{model: RunViewVm}>) {
        return !vnode.attrs.model?.obj ? [] : m(vnode.attrs.model.isManualMode() ? RunManualView : RunWorkflowView, vnode.attrs)
    }
}


var editSteps = (item: RunInfo, model: RunEditVm | RunNewVm) => [
    {
        title: 'Basic information',
        content: [
            m('.row.valign-wrapper', [
                m(TextEdit, {
                    label: 'Run name',
                    item, field: 'name',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Name used for display and search. Must be unique within borehole'),
            ]),

            ... model.checkTag('mud_weight') != null ? [
                m('.row.valign-wrapper', [
                    m(FloatEdit, {
                        label: fh('Mud weight', model.user.us.density),
                        item, field: 'mud_weight',
                        required: true, 
                        className: fieldClass,
                    }),
                    m(descriptionSelector, 'Average drilling mud density'),
                ]),
            ]:[],
        ]
    },
    ... model.checkTag('bha') ? [
    {
        title: 'BHA Structure',
        content: [m(BhaEdit, {bha: item.bha, us: model.user.us, model})]
    },
    {
        title: 'BHA Parameters',
        content: m('.fill', 
            m('[style=width:100%]', 
                hasBend(item.bha) ? [
                    m('.row.valign-wrapper', [
                        m(FloatEdit, {
                            label: fh('Bend angle', model.user.us.angle),
                            item: item.bha, field: 'bend_angle',
                            required: true, 
                            className: 'col s12 m6 l3',
                        }),
                        m(FloatEdit, {
                            label: fh('Bend to bit', model.user.us.length),
                            item: item.bha, field: 'bend_to_bit',
                            required: true, 
                            className: 'col s12 m6 l3',
                        }),
                        m(descriptionSelector, 'BHA bend properties'),
                    ]),
                ] : [],
                hasMwd(item.bha) ? m('.row.valign-wrapper', [
                    m(FloatEdit, {
                        label: fh('D&I to bit', model.user.us.length),
                        item: item.bha, field: 'dni_to_bit',
                        required: true, 
                        className: fieldClass,
                    }),
                    m(descriptionSelector, 'Distance from D&I MWD sensor to bit'),
                ]) : '',
            ),
            m('h5', "Blades"),
            BhaBladesGrid(item.bha.blades, model.user.us, true),
        )
    }

    ]:[],
    {
        title: 'Wellbore geometry',
        content: model.isManualMode() ? m('.fill', [
            m(FileInput, {
                placeholder: 'Import geometry from WITSML or JSON',
                multiple: false,
                accept: ['.json', '.xml'],
                onchange: async (files) => {
                    await model.loadGeometry(files[0])
                },
            }),
            GeometryGrid(item.geometry, model.user.us, true),
        ]) : model.is_last_section_cased ? m('.row.valign-wrapper', [
            m(FloatEdit, {
                label: fh('Section diameter', model.user.us.diameter),
                item: model, field: 'hole_size',
                required: true, 
                className: fieldClass,
            }),
            m(descriptionSelector, 'Open hole section diameter'),
        ]) : [
            m('.row', m(BoolEdit, {
                isRadio: true, inline: false,
                labelTrue: `Continue`,
                labelFalse: `Start new`,
                required: true, 
                className: 'col s12 m6', 
                checkboxClass: 'col s3 btn-tg waves-effect waves-dark',
                label: `Continue wellbore section of ${model.last_section.hole_diameter} mm or Start new one?`, 
                item: model, field: 'continue_section'
            })),
            (model.continue_section === false ? [
                m('p', 'Enter casing info of last section'),
                m('.row.valign-wrapper', 
                    m(TextEdit, { required: true, className: fieldClass, label: 'Description', item: model.last_section, field: 'description' }),
                    m(descriptionSelector, '()'),
                ), 
                m('.row.valign-wrapper', 
                    m(FloatEdit, { className: 'col m2', label: fh('Casing start', model.user.us.length), item: model.last_section, field: 'casing_start' }),
                    m(FloatEdit, { className: 'col m2', label: fh('Casing stop', model.user.us.length), item: model.last_section, field: 'casing_stop' }),
                    m(FloatEdit, { className: 'col m2', label: fh('Casing inner diameter', model.user.us.diameter), item: model.last_section, field: 'casing_inner_diameter' }),
                    m(descriptionSelector, '()'),
                ), 
                m('p', 'Enter new section diameter'),
                m('.row.valign-wrapper', 
                    m(FloatEdit, {
                        className: fieldClass, label: fh('New section diameter', model.user.us.diameter), item: model, field: 'hole_size', required: true, 
                    }),
                    m(descriptionSelector, '()'),
                ),
            ] : '') 
        ], 
    },
]

export var RunNew = {
    view: (vnode: m.Vnode<{model: RunNewVm}>) => [
        m(Stepper, {
            linear: true,
            steps: [
                ...editSteps(vnode.attrs.model.obj, vnode.attrs.model), 
                {
                    title: 'Plan',
                    content: PlanUpload(vnode.attrs.model)
                }
            ]
        }),
    ]
}

export var RunEdit = {
    view: (vnode: m.Vnode<{model: RunEditVm}>) => !vnode.attrs.model?.obj ? [] : [
        m(Stepper, {
            editMode: true, 
            steps: editSteps(vnode.attrs.model.obj, vnode.attrs.model)
        })
    ]
}
