import m from 'mithril'
import { Tabs } from 'mithril-materialized'
import { childList, latlon, fieldClass, descriptionSelector, breadcrumbs } from './common'
import { TextEdit } from '../components/common'
import { Stepper } from '../stepper'
import { OilfieldProperitesCard, addPropertiesColumn } from './properties'
import { OilfieldEditVm, OilfieldNewVm, OilfieldViewVm } from '../viewmodels/oilfield'
import { OilfieldInfo, UnitSystem } from '../types'


export var OilfieldView = {
    view: function (vnode: m.Vnode<{model: OilfieldViewVm}>) {
        var model = vnode.attrs.model
        var f = model.obj;
        return !vnode.attrs.model?.obj ? [] : [
            breadcrumbs(model),
            addPropertiesColumn(
            m(Tabs, {
                tabs: [
                    { 
                        title: 'Pads', 
                        vnode: childList(model.pads, f.pads), 
                    },
                ]
            }), OilfieldProperitesCard(model, f)) 
        ]
    }
}

var editSteps = (item: OilfieldInfo, us: UnitSystem) => [
    {
        title: 'Basic information',
        content: [
            m('.row.valign-wrapper', [
                m(TextEdit, {
                    autofocus: true,
                    label: 'Oilfield name',
                    item, field: 'name',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Name used for display and search. Must be unique within client'),
            ]),
            latlon(us, item, 'Base oilfield location is used to validate pad placing'),
        ]
    },
]

export var OilfieldNew = {
    view: ({attrs: {model}}: m.Vnode<{model: OilfieldNewVm}>) => [
        m(Stepper, {
            linear: true,
            steps: editSteps(model.obj, model.user.us)
        })
    ]
}

export var OilfieldEdit = {
    view: ({attrs: {model}}: m.Vnode<{model: OilfieldEditVm}>) => !model?.obj ? [] : [
        m(Stepper, {
            editMode: true, 
            steps: editSteps(model.obj, model.user.us)
        })
    ]
}
