import m from 'mithril'
import { Button, Collection } from 'mithril-materialized'
import { TasksVm } from '../viewmodels/tasks'


const icons = {
    'scheduled': 'watch_later',
    'running': 'watch_later',
    'faulted': 'error',
    'completed': 'task_alt',
}

const classes = {
    'scheduled': 'grey-text',
    'running': 'grey-text',
    'faulted': 'red-text',
    'completed': 'green-text',
}

export var TasksView = {
    view: function (vnode: m.Vnode<{model: TasksVm}>) {
        const model = vnode.attrs.model
        return m(Collection, {items: model.tasks.map(t => ({
            title: m('', 
                m('i.material-icons.left', {className: classes[t.status]},  icons[t.status]), 
                m(Button, {
                    label: 'Request', 
                    className: 'right', iconName: 'download', iconClass: 'right', 
                    onclick: () => model.exportRequest(t)
                }),
                m('', t.parent_id, m('', t.type) )
            ),
        }))})
    }
}