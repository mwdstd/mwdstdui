import m from 'mithril'
import { ModalPanel } from 'mithril-materialized'
import { DialogService}  from './dialog'
import { spinner } from './views/common'
import { Auth } from './auth'
import { NavDropdown } from './components/navdropdown'
import { AboutModal } from './about'


interface IMenuOptions {
    path: {ref: string, title:string}[]
    control: boolean
    debug: boolean
}

export const Layout = {
    view: function(vnode: m.Vnode<IMenuOptions>) {
        const {control, debug} = vnode.attrs
        return [ 
            m('.container', [
                m('nav.nav-extended', 
                    m('.nav-wrapper',
                        m(m.route.Link, {class: "brand-logo", href: '/'}, 'MWD STD Basic'),
                        m('ul.right',
                            control ? m('li', m(m.route.Link, {href: '/control'}, 'Dashboard')) : '',
                            debug ? m('li', m(m.route.Link, {href: '/debug'}, 'Debug')) : '',
                            m('li', m('a.modal-trigger', {href: '#aboutModal'}, m('i.material-icons', 'help'))),
                            m('li', m(NavDropdown, {
                                iconName: 'account_circle',
                                label: 'User',
                                items: [
                                    {label: 'Settings', iconName: 'settings', onclick: () => {m.route.set('/settings')}},
                                    {label: '', divider: true},
                                    {label: 'Sign out', iconName: 'logout', onclick: Auth.signOut},
                                ],
                            })),
                        )
                    ),
                ),
                m("main", vnode.children),
                m(AboutModal),
                m(ModalPanel, {
                    id: 'mainErrorModal',
                    title: 'Error occurred',
                    description: m('', 
                        DialogService.error ? 
                            DialogService.error?.code ? (
                            DialogService.error?.code == 422 ? [
                                m('h6', 'Validation error'), 
                                Array.isArray(DialogService.error.response.detail) ?  
                                    m('ul', DialogService.error.response.detail.map((i) => m('li', m('b', i.loc.join('.')), ' ', i.msg))) :
                                    m('p', DialogService.error.response.detail)
                            ] : 
                            [
                                m('h6', 'Backend error'), 
                                m('p', DialogService.error.response.detail)
                            ]
                            ) : DialogService.error?.message ? 
                                m('h6', DialogService.error.message) : 
                                m('h6', 'Unknown error') : 
                        '',
                    ),
                    bottomSheet: true,
                    onCreate: (modal) => { DialogService.errorModal = modal }
                }),
                m(ModalPanel, {
                    id: 'progressModal',
                    title: null,
                    description: m('.center-align', spinner()),
                    options: { 
                        endingTop: '40%',
                        dismissible: false, 
                    },
                    onCreate: (modal) => { DialogService.progressModal = modal }
                })
            ]),
        ]
    }
}