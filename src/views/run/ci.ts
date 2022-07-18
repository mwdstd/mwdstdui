import m from 'mithril'
import { Button } from 'mithril-materialized'
import { CiStationsGrid } from '../../components/stations'
import { RunViewVm } from "../../viewmodels/run"
import { actButton } from '../common'

export const CiTab = (model: RunViewVm, show_buttons: boolean = true) => m('', 
    show_buttons ? [
        m(Button, {
            label: 'Export', 
            iconName: "download", 
            className: 'right input-field', 
            onclick: () => {model.exportData('CI', model.obj.ci)}
        }),
        actButton(model.importCi, {className: 'right input-field'}),
    ] : '',
    CiStationsGrid(model.obj.ci, model.user.us)
)