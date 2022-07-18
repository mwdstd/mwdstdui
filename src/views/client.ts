import m from 'mithril'
import { Tabs } from 'mithril-materialized'
import {childList, fieldClass, descriptionSelector, breadcrumbs} from './common'
import {EnumEdit, TextEdit} from '../components/common'
import {Stepper} from '../stepper'
import { ClientEditVm, ClientNewVm, ClientViewVm } from '../viewmodels/client'
import { addPropertiesColumn, ClientProperitesCard } from './properties'

export var ClientView = {
    view: function (vnode: m.Vnode<{model: ClientViewVm}>) {
        var model = vnode.attrs.model
        return [
            breadcrumbs(model),
            addPropertiesColumn(
            m(Tabs, {
                tabs: [
                    { title: 'Oilfields', vnode: childList(model.oilfields, model.obj.oilfields) }
                ]
            }), ClientProperitesCard(model, model.obj))
        ]
    }
}
var editSteps = (model: ClientEditVm | ClientNewVm) => [
    {
        title: 'Basic information',
        content: [
            m('.row.valign-wrapper', [
                m(TextEdit, {
                    autofocus: true,
                    label: 'Organization name',
                    item: model.obj, field: 'name',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Name used for display and search. Must be unique'),
            ]),
            m('.divider'), 
            // m('h6', 'Service features'),
        ]
    },
]

export var ClientNew = {
    view: (vnode: m.Vnode<{model: ClientNewVm}>) => [
        m(Stepper, {
            linear: true,
            steps: editSteps(vnode.attrs.model)
        })
    ]
}

export var ClientEdit = {
    view: (vnode: m.Vnode<{model: ClientEditVm}>) => !vnode.attrs.model?.obj ? [] : 
    m(Stepper, {
        editMode: true, 
        steps: editSteps(vnode.attrs.model)
    })
}

