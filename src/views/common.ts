import m from 'mithril'
import { Button, Collapsible, Collection, CollectionMode, ModalPanel, NumberInput, RoundIconButton, SmallButton } from 'mithril-materialized'
import {Card} from '../components/common'
import { StationsGrid } from '../components/stations'
import { DialogService } from '../dialog'
import { DbObject, UnitSystem } from '../types'
import { fh, fv, fvn } from '../units'
import { BaseEditVm, BaseVm, ChildrenVm, IAction } from '../viewmodels/common'


export var EditComponent = function() {
    var locked = false
    return {
        view: (vnode: m.Vnode<{model: BaseEditVm, component: m.ComponentTypes<{model: BaseEditVm, item: any}>}>) => { 
            var model = vnode.attrs.model
            if(!model) return m('', 'Empty model')
            var obj = model.obj
            // if(!obj) return []
            return [
                breadcrumbs(model),
                m("form", {
                    onsubmit: async function(e) {
                        e.preventDefault()
                        if(locked) return
                        locked = true;
                        try
                        {
                            await model.submit()
                        } catch(e) {
                            DialogService.showError(e)
                            locked = false
                        }
                    }
                }, 
                m(vnode.attrs.component, {item: obj, model: model}),
            )
        ]},
    }
}

interface IModalEditOptions {
    id: string
    title: string
    description: m.Children
    fixedFooter?: boolean,
    onOpenStart?: () => void
    onSubmit: () => void
}

export var ModalEditComponent = function() {
    var key = 0
    return {
        view: (vnode: m.Vnode<IModalEditOptions>) => 
        {
            return [
                m(ModalPanel, {
                    id: vnode.attrs.id,
                    title: vnode.attrs.title,
                    fixedFooter: vnode.attrs.fixedFooter,
                    //description: m('', {key}, vnode.attrs.description),
                    description: m('', vnode.attrs.description),
                    options: { 
                        dismissible: false, 
                        onOpenStart: () => { key++; vnode.attrs.onOpenStart?.(); m.redraw() },
                    },
                    buttons: [
                        {
                            label: 'OK', iconName: 'check',
                            onclick: vnode.attrs.onSubmit
                        },
                        {label: 'Cancel', iconName: 'close'},
                    ],
                })
            ]
        },
        onupdate: (vnode) => {
            var dom = vnode.dom
            var inputs = dom.querySelectorAll('input, textarea, select');
            if(!inputs) return false
            inputs = Array.from(inputs)
            var validity = inputs.every((el) => el.checkValidity())
            var btn = dom.children[1].children[0]
            if(validity) 
                btn.removeAttribute('disabled')
            else
                btn.setAttribute('disabled', 'true')
        }
    }
}

export const breadcrumbs = (model: BaseVm) => [
    m('.progress', {style: 'margin: -4px 0px; top: -4px', className: model.destroy_flag ? '' : 'hide'}, m('.indeterminate')),
    m('', {style: 'line-height:64px'},
        model.path.map(p =>
            m(m.route.Link, {class: "breadcrumb light-blue-text darken-1", href: p.ref}, p.title)),
    ),
]

export var childList = (model: ChildrenVm, list: DbObject[]) => 
    // m('.row', [
    //     // m(TextInput, {
    //     //     label: `Find ${model.display_name}...`,
    //     //     iconName: 'search',
    //     //     className: 'col s8'
    //     // }),
    //     // m(Select, {className: 'col s2', label:'Type', initialValue: 'active', options:[
    //     //     { label: 'Active', id: 'active' },
    //     //     { label: 'Archived', id: 'archived' },
    //     //     { label: 'All', id: 'all' },
    //     // ]}),
    //     // m(Button, {
    //     //     label: "Add new", 
    //     //     iconName: "add", 
    //     //     className: 'col s2 input-field offset-s10', 
    //     //     onclick: (e) => {m.route.set(model.create_path)}
    //     // }),
    // ]),
    m(Collection, {
        header: !model.createNew.hide?.() ? m('.left-align',
            actButton(model.createNew)) as unknown as string : '',
        mode: CollectionMode.LINKS,
        items: list.map(o => ({title: model.name_generator(o), href: model.child_path(o.id)}))
    })


export var fieldClass = 'col s12 m6'
export var descriptionSelector = '.col.m6.hide-on-small-only'
export var latlon = (us: UnitSystem, obj, description: string, nomargin = false) => 
m(`.row.valign-wrapper${nomargin ? '.no-margin' : ''}`, [
    m(NumberInput, {
        label: fh('Latitude', us.angle),
        step: 'any',
        required: true,
        dataError: 'Latitude must be between -90 and 90',
        className: 'col s6 m3',
        min: -90,
        max: 90,
        onchange: (v) => { obj.lat = v },
        initialValue: obj.lat,
    }),
    m(NumberInput, {
        label: fh('Longitude', us.angle),
        step: 'any',
        required: true,
        className: 'col s6 m3',
        dataError: 'Longitude must be between -180 and 180',
        min: -180,
        max: 180,
        onchange: (v) => { obj.lon = v },
        initialValue: obj.lon,
    }),
    m(descriptionSelector, description),
])

export var alt = (us: UnitSystem, obj, description: string, nomargin = false) => m(`.row.valign-wrapper${nomargin ? '.no-margin' : ''}`, [
    m(NumberInput, {
        label: fh('Altitude', us.length),
        step: 'any',
        required: true,
        className: fieldClass,
        dataError: 'Altitude must be between -9000 and 9000',
        min: -9000,
        max: 9000,
        onchange: (v) => { obj.alt = v },
        initialValue: obj.alt,
    }),
    m(descriptionSelector, description),
])

export var spinner = (style = '') => m(`.preloader-wrapper.active.small[style='${style}']`, m('.spinner-layer.spinner-blue-only',
    m('.circle-clipper.left', m('.circle')),
    m('.gap-patch', m('.circle')),
    m('.circle-clipper.right', m('.circle'))
))

export const messageCard = (message: string) =>
    m('.col.s6.push-s3.card-panel.valign-wrapper', 
        {style: 'height:100px;justify-content:center;margin-top:50px;'}, 
        m('.center-align', message)
    )



export var TrajectoryLegsCard = (us: UnitSystem, title, legs, action?) => m(Card, {
    className: 'z-depth-0',
    title,
    action,
    body: m(Collapsible, {
        accordion: true,
        items: legs.map(r => ({
                header: m('span', m('', 
                    m('b', r.name)), 
                    m('div', m.trust(`Depth: ${fvn(Math.min(...r.stations.map(s => s.md)), us.length)} &ndash; ${fv(Math.max(...r.stations.map(s => s.md)), us.length)}`)),
                ),
                body: StationsGrid(r.stations.slice().sort((s1, s2) => s1.md - s2.md), us)
            })
        )
    })
})

export const actButton = (act?: IAction, opts?: any) => !act || act.hide?.() ? '' : m(Button, {
    label: act.name,
    iconName: act.icon,
    disabled: act.disabled?.(),
    onclick: act.action,
    ...opts
})

export const actButtonSm = (act?: IAction, opts?: any) => !act || act.hide?.() ? '' : m(SmallButton, {
    label: act.name,
    iconName: act.icon,
    disabled: act.disabled?.(),
    onclick: act.action,
    ...opts
})