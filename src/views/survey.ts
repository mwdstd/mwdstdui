import m from 'mithril'
import { Button, FileInput } from 'mithril-materialized'
import { fieldClass, descriptionSelector } from './common'
import { BoolEdit, FloatEdit, DateTimeEdit } from '../components/common'
import { Stepper } from '../stepper'
import { SurveyInfo } from '../types'
import { SurveyEditVm, SurveyNewVm } from '../viewmodels/survey'
import { DialogService } from '../dialog'
import { dlsh, fh, fvn } from '../units'
import { CiStationsGrid, StationsGrid } from '../components/stations'

const qcTrueFalseR = {true: 'green', false: 'red'}
const qcTrueFalseY = {true: 'green', false: 'yellow'}

const PlanUploadInt = (model: SurveyNewVm) => [
    m(FileInput, {
        placeholder: 'Import plan from CSV or JSON',
        multiple: false,
        accept: ['text/csv', 'application/json'],
        onchange: async (files) => {
            try {
                model.plan.stations = await model.loadTraj(files[0])
            } catch(e) {
                DialogService.showError(e)
            }
            m.redraw()
        },
    }),
    StationsGrid(model.plan.stations, model.user.us, true)
]

export var PlanUpload = (model: SurveyNewVm) => m('.fill', 
    m('.row.valign-wrapper', [
        m(FloatEdit, {
            label: 'Revision',
            item: model.plan, field: 'revision',
            required: true, 
            className: fieldClass,
        }),
        m(descriptionSelector, 'Current plan revision number'),
    ]), 
    PlanUploadInt(model)
)


function isNew(obj: SurveyEditVm | SurveyNewVm): obj is SurveyNewVm {
    return (obj as SurveyNewVm).importSurvey !== undefined;
}

var editSteps = (item: SurveyInfo, model: SurveyEditVm | SurveyNewVm) => [
    {
        title: 'Time & Depth',
        content: [
            m('.row.valign-wrapper', [
                m(FloatEdit, {required: true, className: fieldClass, label: fh('MD', model.user.us.length), item, field: 'md' }),
                m(descriptionSelector, '(Description missing)'),
            ]),
            m('.row.valign-wrapper', [
                m(DateTimeEdit, {required: true, className: fieldClass, labelDate: 'Date', labelTime: 'Time', item, field: 'time' }),
                m(descriptionSelector, '(Description missing)'),
            ]),
            isNew(model) ? 
            m('.row.valign-wrapper', 
                m(Button, {label: 'Import from CSV', iconName: 'upload', onclick: () => {model.importSurvey()}})
            ) : 
            m('.row', 
                m(BoolEdit, {
                    isRadio: true, className: fieldClass,
                    checkboxClass: 'col s3 btn-tg waves-effect waves-dark',
                    label: 'Survey passed validation checks', item: model.obj, field: 'pre_qc' 
                })
            )
        ],
    },
    {
        title: '6-axis',
        content: [
            m('.row.valign-wrapper', [
                m(FloatEdit, {required: true, className: fieldClass, label: fh('Gx', model.user.us.acceleration), item, field: 'gx'}),
                m(FloatEdit, {required: true, className: fieldClass, label: fh('Gy', model.user.us.acceleration), item, field: 'gy'}),
                m(FloatEdit, {required: true, className: fieldClass, label: fh('Gz', model.user.us.acceleration), item, field: 'gz'}),
                m(descriptionSelector, 'Accelerometer axis values'),
            ]),
            m('.row.valign-wrapper', [
                m(FloatEdit, {required: true, className: fieldClass, label: fh('Bx', model.user.us.magind), item, field: 'bx'}),
                m(FloatEdit, {required: true, className: fieldClass, label: fh('By', model.user.us.magind), item, field: 'by'}),
                m(FloatEdit, {required: true, className: fieldClass, label: fh('Bz', model.user.us.magind), item, field: 'bz'}),
                m(descriptionSelector, 'Magnetomater axis values'),
            ]),
        ],
        validate: () => isNew(model) ? model.calculateCorrection().then(() => m.redraw()) : {}
    },
    ... model.checkTag('ds_weight') != null || model.checkTag('temp') != null ? [
    {
        title: 'Drilling parameters',
        content: [
            ... model.checkTag('temp') != null ? [
                m('.row.valign-wrapper', [
                    m(FloatEdit, {required: true, className: fieldClass, label: fh('Temperature', model.user.us.temperature), item, field: 'temp'}),
                    m(descriptionSelector, '(Description missing)'),
                ]),
            ] : [],
            ... model.checkTag('ds_weight') != null ? [
            m('h6', 'Drillsting weight'),
                m('.row.valign-wrapper', [
                    m(FloatEdit, {required: true, className: fieldClass, label: fh('Pick up', model.user.us.mass), item, field: 'ds_weight_up'}),
                    m(descriptionSelector, '(Description missing)'),
                ]),
                m('.row.valign-wrapper', [
                    m(FloatEdit, {required: true, className: fieldClass, label: fh('Slack off', model.user.us.mass), item, field: 'ds_weight_down'}),
                    m(descriptionSelector, '(Description missing)'),
                ]),
                m('.row.valign-wrapper', [
                    m(FloatEdit, {required: true, className: fieldClass, label: fh('Rotation', model.user.us.mass), item, field: 'ds_weight_rot'}),
                    m(descriptionSelector, '(Description missing)'),
                ]),
        ] : [],
        ]
    }
    ]:[],
]

var SsAndCiSteps = (model: SurveyNewVm) => model.isManualMode() ? [] : [
    ...model.checkTag('ci') ? [
    {
        title: 'Cont. inclination',
        content: m('.fill', [
            m(FileInput, {
                className: 'col',
                placeholder: 'Upload continuous inclination surveys',
                multiple: false,
                accept: ['.json', '.las'],
                onchange: async (files) => {await model.importCi(files[0])},
            }),
            CiStationsGrid(model.ci, model.user.us, true),
            !model.is_ci_empty && (!model.ci || model.ci.length == 0) ?
            m('.row',
                m(Button, {
                    label: 'Skip', className: 'right next-step', style: 'width: 104px', 
                    onclick: () => {
                        model.is_ci_empty = true
                    }}
                )
            ): ''
        ]),
        validate: () => model.validateCi()
    }] : []
]

const valDelta = (val, ref, field, unit) => [
    fvn(val[field], unit),
    m('br'),
    m('span', `(${fvn(val[field] - ref[field], unit, true)})`)
]

const highlightGR = (qc) => ({
    className: 'lighten-4 ' + qcTrueFalseR[qc] 
})
const highlightGY = (qc) => ({
    className: 'lighten-4 ' + qcTrueFalseY[qc] 
})
var ValidationStep = (model: SurveyNewVm) => ({
    title: 'Validation',
    content: [
        m('.row', {style: 'margin-bottom: 0px;'},
            m('.col.l6.m12.fill', 
                ...!model.isManualMode() ? [
                m('.row.valign-wrapper', 
                m(BoolEdit, {
                    isRadio: true, required: true, className: 'col m4', label: `Is plan revision #${model.parent.plan.revision}?`, 
                    checkboxClass: 'col s6 btn-tg waves-effect waves-dark',
                    item: model, field: 'is_plan_actual'
                }),
                model.is_plan_new ? [
                    m(FloatEdit, {
                        label: 'Revision',
                        item: model.plan, field: 'revision',
                        required: true, 
                        className: 'col m2',
                    }),
                    m(descriptionSelector, 'Current plan revision number'),
                ] : '',),
                model.is_plan_new ? PlanUploadInt(model) : ''
            ] : []        
            ),
            m('.col.l6.m12',
                m("table", 
                    m('thead', m('tr', 
                        m('th', { style: 'width: 100px;' }), 
                        m('th.center-align', { style: 'width: 100px;' }, 'Reference'), 
                        m('th.center-align', { style: 'width: 100px;' }, 'Raw'), 
                        model.corrected ? m('th.center-align', 'Corrected') : '',
                        model.delta ? m('th.center-align', 'QC') : '',
                    )),
                    m("tr", [
                        m("th", fh('G', model.user.us.acceleration)),
                        m("td.center-align", fvn(model.reference.g, model.user.us.acceleration)),
                        m("td.center-align", model.raw ? highlightGR(model.raw.qc_pass.g) : {}, valDelta(model, model.reference, 'g', model.user.us.acceleration)),
                        model.corrected ? m("td.center-align", highlightGR(model.corrected.qc_pass.g), valDelta(model.corrected, model.reference, 'g', model.user.us.acceleration)) : '',
                        model.delta ? m("td.center-align", fvn(model.delta.g, model.user.us.acceleration)) : '',
                    ]),
                    m("tr", [
                        m("th", fh('B', model.user.us.magind)),
                        m("td.center-align", fvn(model.reference.b, model.user.us.magind)),
                        m("td.center-align", model.raw ? highlightGR(model.raw.qc_pass.b) : {}, valDelta(model, model.reference, 'b', model.user.us.magind)),
                        model.corrected ? m("td.center-align", highlightGR(model.corrected.qc_pass.b), valDelta(model.corrected, model.reference, 'b', model.user.us.magind)) : '',
                        model.delta ? m("td.center-align", fvn(model.delta.b, model.user.us.magind)) : '',
                    ]),
                    m("tr", [
                        m("th", fh('Dip', model.user.us.angle)),
                        m("td.center-align", fvn(model.reference.dip, model.user.us.angle)),
                        m("td.center-align", model.raw ? highlightGR(model.raw.qc_pass.dip) : {}, valDelta(model, model.reference, 'dip', model.user.us.angle)),
                        model.corrected ? m("td.center-align", highlightGR(model.corrected.qc_pass.dip), valDelta(model.corrected, model.reference, 'dip', model.user.us.angle)) : '',
                        model.delta ? m("td.center-align", fvn(model.delta.dip, model.user.us.angle)) : '',
                    ]),
                    m("tr", [
                        m("th", fh('Inc', model.user.us.angle)),
                        m("td"),
                        m("td.center-align", fvn(model.inc, model.user.us.angle)),
                        model.corrected ? m("td.center-align", highlightGY(model.corrected.qc_pass.inc), fvn(model.corrected.inc, model.user.us.angle)) : '',
                    ]),
                    m("tr", [
                        m("th", fh('Az', model.user.us.angle)),
                        m("td"),
                        m("td.center-align", fvn(model.az, model.user.us.angle)),
                        model.corrected ? m("td.center-align", highlightGY(model.corrected.qc_pass.az), fvn(model.corrected.az, model.user.us.angle)) : '',
                    ]),
                    model.dls ? 
                    m("tr", [
                        m("th", dlsh(model.user.us)),
                        m("td"),
                        m("td"),
                        m("td.center-align", highlightGR(model.dls_pass), fvn(model.dls, model.user.us.angle))
                    ])
                    : ''
                ),
                m(Button, {
                    label: 'Dismiss', className: 'red right', style: 'margin-top: 20px',
                    onclick: () => {m.route.set(model.path[model.path.length - 2].ref)}
                })
            ),
        ),
]})

export var SurveyNew = {
    view: (vnode: m.Vnode<{model: SurveyNewVm}>) => [
        m(Stepper, {
            linear: true,
            steps: [
                ...editSteps(vnode.attrs.model.obj, vnode.attrs.model),
                ...SsAndCiSteps(vnode.attrs.model),
                //...!vnode.attrs.model.isManualMode() ? [PlanStep(vnode.attrs.model)] : [],
                ValidationStep(vnode.attrs.model)
            ]
        })
    ]
}

export var SurveyEdit = {
    view: (vnode: m.Vnode<{model: SurveyEditVm}>) => [
        m(Stepper, {
            editMode: true, 
            steps: editSteps(vnode.attrs.model.obj, vnode.attrs.model)
        })
    ]
}
