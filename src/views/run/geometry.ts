import m from 'mithril'
import { Button } from 'mithril-materialized'
import { GeometryGrid } from '../../components/geometry'
import { Run } from '../../types'
import { RunViewVm } from '../../viewmodels/run'

export var GeometryTab = (obj: Run, model: RunViewVm, show_buttons: boolean = true) => m('', 
    show_buttons ? 
        m(Button, {label: 'Export', iconName: "download", className: 'right input-field', onclick: () => {model.exportData('Geometry', obj.geometry)}})
        : '',
    GeometryGrid(obj.geometry, model.user.us),
)