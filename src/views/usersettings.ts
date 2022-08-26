import m from 'mithril'
import { Button, PasswordInput, SubmitButton } from 'mithril-materialized'
import { ColType, ContentCollection, EnumEdit } from '../components/common'
import { dlsun, un } from '../units'
import { zip } from '../utils'
import { UserSettingsVm } from '../viewmodels/usersettings'
import { breadcrumbs, descriptionSelector, fieldClass } from './common'
import { addPropertiesColumn, UserProperitesCard } from './properties'


const tdca = 'td.center-align'
const thca = 'th.center-align'

export const UserSettings = {
    view: function (vnode: m.Vnode<{model: UserSettingsVm}>) {
        const model = vnode.attrs.model
        const user = model.user
        const us = user.us
        const gaxes = zip(us.gaxes, us.gaxesi)?.map(([a, i]) => (i?'-':'')+a)?.join(', ')
        const maxes = zip(us.maxes, us.maxesi)?.map(([a, i]) => (i?'-':'')+a)?.join(', ')
        return [
            breadcrumbs(model),
            addPropertiesColumn(
                m(ContentCollection, {
                    type: ColType.Tabs, items: [
                        {
                            title: 'Profile',
                            body: m(ContentCollection, {
                                type: ColType.Sections,
                                items: [
                                    {
                                        title: 'Unit System',
                                        body: m('',
                                            m('.row.valign-wrapper', 
                                                m(EnumEdit, {
                                                    className: fieldClass,
                                                    label: 'Select unit system',
                                                    isRadio: true, 
                                                    checkboxClass: 'col s6 btn-tg waves-effect waves-dark',
                                                    item: model,
                                                    field: 'ustype',
                                                    values: {metric: 'Metric', imperial: 'Imperial'},
                                                    onchange: () => model.setUnitSystem()
                                                }),
                                                m(descriptionSelector, 
                                                    m('table', 
                                                        m('thead', m('tr', 
                                                            m('th[width=1]', 'Quantity'),
                                                            m(thca, 'Unit'),
                                                        )),
                                                        m('tbody', 
                                                            m('tr', m('td', 'Length'), m(tdca, un(us.length))),
                                                            m('tr', m('td', 'Diameter'), m(tdca, un(us.diameter))),
                                                            m('tr', m('td', 'DLS'), m(tdca, dlsun(us))),
                                                            m('tr', m('td', 'Weight'), m(tdca, un(us.mass))),
                                                            m('tr', m('td', 'Density'), m(tdca, un(us.density))),
                                                            m('tr', m('td', 'Temperature'), m(tdca, un(us.temperature))),
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    },
                                    {
                                        title: 'MWD Tool',
                                        body: m('',
                                            m('.row.valign-wrapper', 
                                                m(EnumEdit, {
                                                    className: fieldClass,
                                                    label: 'Select tool configuration',
                                                    item: model,
                                                    field: 'tooltype',
                                                    values: {
                                                        standard: 'Standard', standardigxy: 'Standard (Inverted Gx & Gy)', 
                                                        schlumberger: 'Schlumberger', halliburton: 'Halliburton', tensor: 'Tensor'},
                                                    onchange: () => model.setToolType()
                                                }),
                                                m(descriptionSelector, m('table', 
                                                    m('thead', m('tr', 
                                                        m('th[width=1]', 'Property'),
                                                        m(thca, 'Value'),
                                                    )),
                                                    m('tbody', 
                                                        m('tr', m('td', 'Acc unit'), m(tdca, un(us.acceleration))),
                                                        m('tr', m('td', 'Mag unit'), m(tdca, un(us.magind))),
                                                        m('tr', m('td', 'Acc axis alignment'), m(tdca, `[${gaxes}]`)),
                                                        m('tr', m('td', 'Mag axis alignment'), m(tdca, `[${maxes}]`)),
                                                    )
                                                ))
                                            )
                                        )
                                    },
                                ]
                            })
                        },
                        {
                            title: 'Account',
                            body: m(ContentCollection, {
                                type: ColType.Sections,
                                items: [
                                    {
                                        title: 'Change password',
                                        body: m('form', {onsubmit: () => model.changePassword()},
                                            m('.row', m(PasswordInput, {
                                                label: 'Old password',
                                                className: 'col s12 m6',
                                                required: true,
                                                initialValue: model.old_password,
                                                onchange: (v) => {model.old_password = v}
                                            })),
                                            m('.row', m(PasswordInput, {
                                                label: 'New password',
                                                className: 'col s12 m6',
                                                required: true,
                                                initialValue: model.new_password,
                                                onchange: (v) => {model.new_password = v}
                                            })),
                                            m('.row', m(PasswordInput, {
                                                label: 'Confirm new password',
                                                className: 'col s12 m6',
                                                dataError: 'Passwords must match',
                                                initialValue: model.confirm_password,
                                                onchange: (v) => {model.confirm_password = v},
                                                validate: (v) => v == model.new_password,
                                            })),
                                            m(SubmitButton, {
                                                label: 'Update password',
                                            })
                                        )
                                    }
                                ]
                            })
                        }
                    ]

            }),
                UserProperitesCard(user)
            )
        ]
    }
}