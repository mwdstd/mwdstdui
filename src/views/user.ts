import m from 'mithril'
import { Autocomplete, Button, Collection, PasswordInput, Select } from 'mithril-materialized'
import { Stepper } from '../stepper'
import { EnumEdit, TextEdit } from '../components/common'
import { UserRole } from '../types'
import { UserNewVm, UserViewVm } from '../viewmodels/user'
import { breadcrumbs, descriptionSelector, fieldClass } from './common'
import { addPropertiesColumn, UserProperitesCard } from './properties'

const getRoleValues = () => ({
    null: 'Deactivate',
    su: 'SU',
    de: 'DE',
    fe: 'FE',
    cr: 'CR',
})

export var UserView = {
    view: function (vnode: m.Vnode<{model: UserViewVm}>) {
        const model = vnode.attrs.model
        const user = model.obj
        return [
            breadcrumbs(model),
            addPropertiesColumn(
                m('', 
                model.user.role == UserRole.SU && model.user.id != user.id? 
                m('.valign-wrapper',
                    m(EnumEdit, {
                        label: 'Role',
                        isRadio: true, 
                        className: 'col s10',
                        checkboxClass: 'col s2 btn-tg waves-effect waves-dark',
                        item: user,
                        field: 'role',
                        values: getRoleValues(),
                        onchange: () => model.setRole()
                    }),
                    m(Button, {
                        label: 'Delete',
                        className: 'col s2 red',
                        icon: 'delete',
                        onclick: () => model.operations[0].action(null)
                    })
                ) : 
                model.user.role == UserRole.DE && user.role == UserRole.None ? 
                m(Button, {label: 'Activate', onclick: () => {user.role = UserRole.FE; model.setRole()}}) : '',
                user.role == UserRole.CR ? [
                    m(Select, {
                        label: 'Assign to client',
                        initialValue: user.client,
                        options: [
                            {id: null, label: 'Select', disabled: true},  
                            ...model.clients.map(cl => ({id: cl.id, label: cl.name}))
                        ],
                        onchange: (v) => {model.setClient(<string>v[0])}
                    }),
                ] : user.role == UserRole.DE ? [
                    m(Autocomplete, {
                        key: 1,
                        label: 'Assign to new oilfield',
                        data: model.oilfields.reduce((a, v) => ({...a, [v.name]: null}), {}),
                        minLength: 0,
                        onAutocomplete: (name) => {model.addOilfield(name)}
                    }),
                    m(Collection, {
                        key: 3,
                        items: user.oilfields.map((fid) => ({
                            title: model.oilfields.filter(f => f.id == fid)[0]?.name,
                            iconName: 'close',
                            onclick: () => {model.removeOilfield(fid)}
                        }))
                    }),
                ] : user.role == UserRole.FE ? [
                    m(Autocomplete, {
                        key: 2,
                        label: 'Assign to new well',
                        data: model.wells.reduce((a, v) => ({...a, [model.getWellName(v)]: null}), {}),
                        minLength: 0,
                        onAutocomplete: (name) => {model.addWell(name)}
                    }),
                    m(Collection, {
                        key: 3,
                        items: [user.well].map((wid) => ({
                            title: model.getWellName(model.wells.filter(w => w.id == wid)[0]),
                            iconName: 'close',
                            onclick: () => {model.removeWell(wid)}
                        }))
                    }),
                ] : ''
                ), UserProperitesCard(user)
            )
        ]
    }
}

var editSteps = (model: UserNewVm) => [
    {
        title: 'Basic information',
        content: [
            m('.row.valign-wrapper', [
                m(TextEdit, {
                    autofocus: true,
                    label: 'Display name',
                    iconName: 'badge',
                    item: model.obj, field: 'name',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, ''),
            ]),
            m('.divider'), 
            m('.row.valign-wrapper', [
                m(TextEdit, {
                    label: 'Username',
                    iconName: 'account_circle',
                    item: model.obj, field: 'login',
                    required: true,
                    className: fieldClass,
                }),
                m(descriptionSelector, 'Username will be used on login page. Must be unique'),

            ]),        
            m('.row.valign-wrapper', [
                m(PasswordInput, {
                    className: fieldClass,
                    label: 'Password',
                    required: true,
                    iconName: 'lock',
                    onchange: (v) => {model.obj.password = v}
                }),
                m(descriptionSelector, ''),
            ]),        
            m('.row.valign-wrapper', [
                m(PasswordInput, {
                    className: fieldClass,
                    label: 'Re-enter password',
                    required: true,
                    iconName: 'lock',
                    onchange: (v) => {model.pass_confirm = v},
                    validate: (v) => v == model.obj.password,
                    dataError: 'Passwords must match',
                }),
                m(descriptionSelector, ''),
            ]),        
    ]
    },
]

export var UserNew = {
    view: (vnode: m.Vnode<{model: UserNewVm}>) => [
        m(Stepper, {
            linear: true,
            steps: editSteps(vnode.attrs.model)
        })
    ]
}


