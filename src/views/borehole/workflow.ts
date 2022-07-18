import m from 'mithril'
import { Button, Collection, CollectionMode } from "mithril-materialized"
import { BoolEdit, FloatEdit, TextEdit } from "../../components/common"
import { Borehole, UnitSystem } from '../../types'
import { BoreholeViewVm } from '../../viewmodels/borehole'
import { actButton, ModalEditComponent, TrajectoryLegsCard } from "../common"


export var runsListWorkflow = (obj: Borehole, model: BoreholeViewVm) => 
    m(Collection, {
        header: model.newRun.hide?.() ? '' : m('.left-align', [
            actButton(model.newRun),
        ]) as unknown as string,
        mode: CollectionMode.LINKS,
        items: obj.runs.map(o => ({ title: o.name + (o.active ? ' (active)' : ''), href: model.child_path(o.id), active: o.active }))
    })

export var finalizeModal = (model: BoreholeViewVm) => m(ModalEditComponent, {
    id: 'finalizeModal',
    title: 'Finalize borehole',
    description: [m('.row', 
        m(BoolEdit, { isRadio: true, inline: true, required: true, className: 'col s12', label: 'Do you want to finalize drilling section?', item: model, field: 'finalized' }),
        (model.finalized) ? [
            m(TextEdit, { required: true, className: 'col s4', label: 'Description', item: model.section, field: 'description' }),
            m(FloatEdit, { required: true, className: 'col s4', label: 'Stop depth', item: model.section, field: 'stop_depth' }),
            m(FloatEdit, { required: true, className: 'col s4', label: 'Hole diameter', item: model.section, field: 'hole_diameter' }),
            m(FloatEdit, { className: 'col s4', label: 'Casing start', item: model.section, field: 'casing_start' }),
            m(FloatEdit, { className: 'col s4', label: 'Casing stop', item: model.section, field: 'casing_stop' }),
            m(FloatEdit, { className: 'col s4', label: 'Casing inner diameter', item: model.section, field: 'casing_inner_diameter' }),
        ] : ''
    )],
    onSubmit: async () => {
        await model.finalize()
    }
})