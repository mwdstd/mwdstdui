import m from 'mithril'
import { Button, Collection, CollectionMode, Tabs } from 'mithril-materialized'
import { latlon, alt, fieldClass, descriptionSelector, breadcrumbs, actButton } from './common'
import { TextEdit, DateEdit, EnumEdit } from '../components/common'
import { Stepper} from '../stepper'
import { WellTypeValues } from '../enums'
import { PadProperitesCard, addPropertiesColumn } from './properties'
import { PadEditVm, PadNewVm, PadViewVm } from '../viewmodels/pad'
import { PadInfo, UnitSystem } from '../types'

export var PadView = {
    view: function (vnode: m.Vnode<{model: PadViewVm}>) {
        var model = vnode.attrs.model
        var f = model.obj;
        var wells = model.wells
        return !model?.obj ? [] : [
            breadcrumbs(model),
            addPropertiesColumn(
            m(Tabs, {
                tabs: [
                    { 
                        title: 'Wells', 
                        vnode: 
                            m(Collection, {
                                header: wells.createNew.hide?.() ? '' : m('.right-align', [
                                    m(Button, {
                                        label: "Import",
                                        iconName: "upload",
                                        onclick: () => { model.importWell() },
                                    }),
                                    actButton(wells.createNew, {className: 'left'}),
                                ]) as unknown as string,
                                mode: CollectionMode.LINKS,
                                items: f.wells.map(o => ({ 
                                    title: m('', 
                                        m('i.material-icons.right', 
                                            o.maintenance_mode ? 'construction' :
                                                o.data_mode == 'manual' ? 'engineering' : 'precision_manufacturing'), 
                                        m('span.right', 
                                            `L${o.service_level}`), 
                                        o.name), 
                                    href: wells.child_path(o.id) 
                                }))
                                }
                            ), 
                    },
                ]
            }), PadProperitesCard(model, f))
        ]
    }
}

var editSteps = (item: PadInfo, us: UnitSystem) => [
    {
        title: 'Basic information',
        content: [
            m('.row.valign-wrapper.no-margin', [
                m(TextEdit, {
                    autofocus: true,
                    label: 'Pad name',
                    item, field: 'name',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Name used for display and search. Must be unique within oilfield'),
            ]),
            latlon(us, item, 'Pad location is used to validate well placing', true),
            alt(us, item, 'Pad average MSL elevation. Used to validate well placing', true),
            m('.row.valign-wrapper.no-margin', [
                m(EnumEdit, {
                    label: 'Pad type',
                    item, field: 'type',
                    isRadio: true,
                    required: true,
                    values: WellTypeValues,
                    className: fieldClass,
                    checkboxClass: 'btn-tg waves-effect waves-dark',
                    inline: true
                }),
                m(descriptionSelector, 'Land or offshore based. Used in depth error correction'),
            ]),

            m('.divider'), 
            m('h6', 'Period of operation'),
            m('.row.valign-wrapper.no-margin', [
                m(DateEdit, {
                    required: true,
                    label: 'Start date',
                    className: 'col s6 m3',
                    item, field: 'date_start',
                }),
                m(DateEdit, {
                    required: true,
                    label: 'Finish date',
                    className: 'col s6 m3',
                    item, field: 'date_finish',
                }),
                m(descriptionSelector, 'Drilling operation dates'),
            ]),
        ]
    },
]

export var PadNew = {
    view: ({attrs: {model}}: m.Vnode<{model: PadNewVm}>) => [
        m(Stepper, {
            linear: true,
            steps: editSteps(model.obj, model.user.us)
        })
    ]
}

export var PadEdit = {
    view: ({attrs: {model}}: m.Vnode<{model: PadEditVm}>) => !model?.obj ? [] : [
        m(Stepper, {
            editMode: true, 
            steps: editSteps(model.obj, model.user.us)
        })
    ]
}

