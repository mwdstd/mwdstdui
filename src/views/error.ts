import m from 'mithril'
import {ErrorVm} from '../viewmodels/error'
import {breadcrumbs} from './common'

export const ErrorView = {
    view: function (vnode: m.Vnode<{model: ErrorVm}, any>) {
        return [
            breadcrumbs(vnode.attrs.model),
            m('.row',
                m('.col.s6.push-s3',
                    m('h4', 'Not found'),
                    m('.card-panel.valign-wrapper', 
                        {style: 'height:100px;justify-content:center;margin-top:50px;'}, 
                        m('.center-align', vnode.attrs.model.message)
                    ),
                    m('.col.s12', m(m.route.Link, {href: '/'}, 'Go to Home page'),),
                    m('.col.s12', m('a', {href: '#', onclick: (e)=>{e.preventDefault(); history.back()}}, 'Go to previous page')),
                ),
            )
        ]
    }
}
