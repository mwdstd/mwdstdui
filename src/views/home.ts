import m from 'mithril'
import { Button, Collection, CollectionMode, Tabs } from 'mithril-materialized'
import { RoleValues } from '../enums'
import { HomeVm } from '../viewmodels/home'
import { actButton, breadcrumbs, childList } from './common'
import { DashboardView } from './dashboard'
import { addPropertiesColumn, UserProperitesCard } from './properties'

interface HomeAttrs {
    model: HomeVm
}

const roleIcons = {
    null: 'person_off',
    su: 'supervisor_account',
    de: 'person',
    fe: 'person_outline',
    cr: 'account_circle'
}
const roleColors = {
    null: 'gray',
    su: 'green',
    de: 'blue',
    fe: 'brown',
    cr: 'black'
}

export var Home = {
    view: function (vnode: m.Vnode<HomeAttrs, any>) {
        const model = vnode.attrs.model
        return [
            breadcrumbs(model),
            addPropertiesColumn(
                model.objects ? 
                m(Tabs, {
                    tabs: [
                        ...model.dashboard? [
                            {title: 'Dashboard', vnode: m(DashboardView, {model: model.dashboard})}
                        ] : [],
                        { title: model.objects_name, vnode: childList(model.objects, model.list) },
                        ...model.users ? [
                            { 
                                title: 'Users', 
                                vnode: m(Collection, {
                                    header: m('.left-align', actButton(model.createUser)) as unknown as string,
                                    mode: CollectionMode.AVATAR,
                                    items: model.users.map(o => ({
                                        className: roleColors[o.role],
                                        title: m('b', o.name),
                                        avatar: roleIcons[o.role],
                                        content: `${o.login}<br>${RoleValues[o.role]}`,
                                        href: `/user/${o.id}`
                                    }))
                                })
                            }
                        ] : []
                    ]
                }) : m('', 'Account is not activated'), 
                UserProperitesCard(model.user))
        ]
    }
}
