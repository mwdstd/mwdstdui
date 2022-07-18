import m from 'mithril'
import { Button, FileInput } from "mithril-materialized"
import { BoolEdit, FloatEdit } from '../../components/common'
import { StationsGrid } from '../../components/stations'
import { DialogService } from '../../dialog'
import { Station } from '../../types'
import { RunNewVm, RunViewVm } from '../../viewmodels/run'
import { actButton, descriptionSelector, ModalEditComponent } from '../common'

export var PlanUpload = (model: RunNewVm) => m('.fill', 
    m('.row.row.valign-wrapper', 
        model.parent.last_plan ? m(BoolEdit, {
            isRadio: true, required: true, className: 'col m3', label: `Is plan revision #${model.parent.last_plan.revision}?`, 
            checkboxClass: 'col s6 btn-tg waves-effect waves-dark',
            item: model, field: 'is_plan_actual'
        }) : '',
        model.is_plan_new ? [
            m(FloatEdit, {
                label: 'Revision',
                item: model.obj.plan, field: 'revision',
                required: true, 
                className: 'col m3',
            }),
            m(descriptionSelector, 'Current plan revision number'),
        ] : ''
    ),
    model.is_plan_new ? [
        m(FileInput, {
            placeholder: 'Import plan from CSV or JSON',
            multiple: false,
            accept: ['text/csv', 'application/json'],
            onchange: async (files) => {
                try {
                    model.obj.plan.stations = await model.loadTraj(files[0])
                } catch(e) {
                    DialogService.showError(e)
                }
                m.redraw()
    
            },
        }),
        StationsGrid(model.obj.plan.stations, model.user.us, true),
    ] : ''
)

export var PlanView = (model: RunViewVm, show_buttons: boolean = true) => m.fragment({}, [
    m('',
        m('h5.left.input-field', `Revision ${model.obj.plan.revision}`), 
        show_buttons ? [
            m(Button, {
                label: 'Export', 
                iconName: "download", 
                className: 'right input-field', 
                onclick: () => {model.exportData(`Plan-Rev${model.obj.plan.revision}`, model.obj.plan.stations)}
            }),
            actButton(model.uploadPlan, {className: 'right input-field', modalId: 'planModal'}),
        ] : '',
        StationsGrid(model.obj.plan.stations, model.user.us)
    )
])

export var PlanUploadModal = () => {
    var state: {revision?: number, plan: Station[]}= {plan: []}
    return {
        view: (vnode: m.Vnode<{model: RunViewVm}>) => m(ModalEditComponent, {
            fixedFooter: true,
            id: 'planModal',
            title: 'Upload plan revision',
            description: [
                m(FloatEdit, {
                    label: 'Revision number',
                    required: true,
                    item: state, field: 'revision'
                }),
                m(FileInput, {
                    placeholder: 'Import plan from CSV or JSON',
                    multiple: false,
                    accept: ['text/csv', 'application/json'],
                    onchange: async (files) => {
                        state.plan = await vnode.attrs.model.loadTraj(files[0])
                        m.redraw()
                    },
                }),
                StationsGrid(state.plan, vnode.attrs.model.user.us)                        
            ],
            onOpenStart: () => {state = {plan: []}},
            onSubmit: () => {
                vnode.attrs.model.uploadPlan_impl({revision: state.revision, stations: state.plan})
            }
        })
    } 
}

