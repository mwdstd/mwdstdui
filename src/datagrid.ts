import m from 'mithril'
import { FlatButton, SubmitButton } from 'mithril-materialized'
import {BoolEdit, EnumEdit, FloatEdit, TextEdit} from './components/common'

interface IDataColumnBase {
    label?: string
    type?: "enum" | "template" | "float" | "bool" | "time" | "string"
    required?: (item: any) => boolean
    optional?: boolean
}
interface ITemplateDataColumn extends IDataColumnBase {
    type: "template"
    editTemplate?: (item: any) => m.Children
    viewTemplate?: (item: any) => m.Children
}

interface IDataColumn extends IDataColumnBase {
    name: string
}

interface IGenericDataColumn extends IDataColumn {
    type?: "bool" | "string"
}

interface IEnumDataColumn extends IDataColumn {
    type: "enum"
    values?: any
}
interface IFormattedDataColumn extends IDataColumn {
    type: "float" | "time"
    format?: any
}


export type DataColumn = (ITemplateDataColumn | IEnumDataColumn | IFormattedDataColumn | IGenericDataColumn)

interface IDataGrid extends m.Attributes {
    columns: DataColumn[]
    items: any[]
}

export var DataGrid = function(){
    var selected_item
    var edit_item
    var is_new_item

    function rowEdit(cols: DataColumn[]) {
        return m('tr.collection-item', [
            cols.map(c => m('td', editCell(c))),
            m('td.right-align', 
                m(SubmitButton, {className: 'btn-flat', iconClass: 'center', iconName: 'check'}),
                m(FlatButton, {iconClass: 'center', iconName: 'close', onclick: () => {
                    selected_item = undefined
                    is_new_item = false
                }})
            )
        ])
    }

    function editCell(c: DataColumn){
        if(c.required && !c.required(edit_item)) return ''
        switch(c.type) {
            case 'enum':
                return m(EnumEdit, {
                    id: 'sel-' + c.name,
                    classes: '',
                    //isRadio: true,
                    //inline: true,
                    required: !c.optional,
                    className: 'inline-input', 
                    item: edit_item,
                    field: c.name,
                    values: c.values
                })
            case 'template':
                return c.editTemplate ? c.editTemplate(edit_item) : ''
            case 'float':
                return m(FloatEdit, {
                    required: !c.optional,
                    className: 'inline-input', 
                    item: edit_item,
                    field: c.name,
                })
            case 'bool':
                return m(BoolEdit, {
                    isRadio: true,
                    //inline: true,
                    required: !c.optional,
                    //className: 'inline-input', 
                    item: edit_item,
                    field: c.name,
                  })
            default:
                return m(TextEdit, { 
                    required: !c.optional,
                    className: 'inline-input', 
                    item: edit_item,
                    field: c.name,
                })
        }
    }

    function viewCell(col: DataColumn, item: any){
        if(col.required && !col.required(item)) return ''
        switch(col.type) {
            case 'enum':
                var value = item[col.name]
                var v = col.values ? col.values[value] : value
                return v ? v : '-'
            case 'template':
                return col.viewTemplate ? col.viewTemplate(item) : ''
            case 'bool':
                var value = item[col.name]
                return m('i.material-icons', value ? 'check_box' : 'check_box_outline_blank')
            case 'float':    
                var value = item[col.name]
                return typeof value === 'number' ? value.toLocaleString([], col.format || {}) : '-'
            case 'time':
                var value = item[col.name]
                return value ? new Date(value).toLocaleTimeString([], col.format || {}) : '-'
            default:
                var value = item[col.name]
                return value ? `${value}` : '-'
        }
    }

    return {
        oninit: (vnode: m.Vnode<IDataGrid>) => {
            var attrs = vnode.attrs
            var factory = attrs.factory
            edit_item = factory ? factory() : {}
        },
        view: (vnode: m.Vnode<IDataGrid>) => {
            var attrs = vnode.attrs
            var cols = attrs.columns
            var items = attrs.items || []
            var editable = attrs.editable
            var canUserAddRows = attrs.canUserAddRows ?? editable
            var canUserDelRows = attrs.canUserDelRows ?? editable
            var factory = attrs.factory
            var w = 100 / (cols.length + (editable ? 1 : 0))
            var form_class = editable ? '.form-scroll' : ''
            return [
                m('form' + form_class, {onsubmit:(e) => {
                    e.preventDefault()
                    if(is_new_item) {
                        items.push(edit_item)
                        is_new_item = false
                    }
                    else {
                        const index = items.indexOf(selected_item);
                        if (index > -1) items[index] = edit_item
                        selected_item = undefined
                    }
                }},
                m('table.highlight', [
                    m('thead', m('tr', 
                        cols.map(c => m(`th[style=width:${w}%]`, c.label)),
                        editable ? m('th[style=min-width:110px]') : ''
                    )),
                    m('tbody', [
                        items.map(i => (selected_item === i) ?
                            rowEdit(cols)
                            :
                            m(`tr.collection-item`, [
                                cols.map(c => m('td', viewCell(c, i))),
                                editable ? m('td.right-align', [ 
                                    m(FlatButton, {iconClass: 'center', iconName: 'edit', onclick: () => {
                                        selected_item = i
                                        edit_item = Object.assign({}, selected_item)
                                        is_new_item = false
                                    }}),
                                    canUserDelRows ? m(FlatButton, {iconClass: 'center', iconName: 'delete', onclick: () => {
                                        const index = items.indexOf(i);
                                        if (index > -1)
                                            items.splice(index, 1);
                                    }}) : '',
                                ]) : ''
                            ]),
                        ),
                        canUserAddRows ? (
                        is_new_item ? rowEdit(cols) 
                        : m('tr', [cols.map(c => m('td')), m('td.right-align', m(FlatButton, {iconClass: 'center', iconName: 'add', onclick: () => {
                            edit_item = factory ? factory() : {}
                            selected_item = undefined
                            is_new_item = true
                        }}))])) : ''
                    ]),
                ])
                ) 
            ]
        }
    }
}
