import m, { Child } from 'mithril'
import moment from 'moment'
import { Collapsible, DatePicker, InputCheckbox, IRadioButtons, ISelectOptions, NumberInput, RadioButtons, Select, Tabs, TextInput, TimePicker } from "mithril-materialized"

export var TextEdit: m.Component<any> = {
    view: (vnode) => {
        var required = vnode.attrs.required || false
        var className = vnode.attrs.className
        var label = vnode.attrs.label
        var item = vnode.attrs.item
        var field = vnode.attrs.field
        var disabled = vnode.attrs.disabled
        var autofocus = vnode.attrs.autofocus
        var iconName = vnode.attrs.iconName

        return m(TextInput, { 
                autofocus,
                disabled,
                required, 
                className, 
                label, 
                iconName,
                initialValue: item[field],
                onchange: (v) => {item[field] = v} 
                //{item[field] = v || null}
            })
    }
}

export var FloatEdit: m.Component<any> = {
    view: (vnode) => {
        const {autofocus, className, disabled, required, label, item, field, format, style, onchange} = vnode.attrs;
        return m(NumberInput, { 
                autofocus,
                disabled,
                required: required || false, 
                className, 
                style, 
                step: format ? 0.1 ** format.maximumFractionDigits : 'any', 
                label, 
                initialValue: format ? item[field]?.toLocaleString([], {...format, useGrouping: false }) :  item[field],
                onchange: async (v) => {
                    item[field] = v
                    if (onchange) await onchange(v)
                } 
                //{item[field] = v ? v : (v === 0 ? 0 : null)}
            })
    }
}

export var EnumEdit: m.Component<any> = {
    view: (vnode) => {
        const {checkboxClass, className, classes, disabled, 
            field, id, inline, isRadio, item, label, onchange, required, values} = vnode.attrs

        var opts = { 
            id,
            classes,
            dropdownOptions: {container: document.body},
            placeholder: 'Select',
            disabled,
            required: required || false, 
            className: inline ? 'input-field ' + className : className, 
            label, 
            options: Object.entries(values).map(([k, v]) => ({id: k, label: v})),
            checkedId: String(item[field]),
            onchange: isRadio ? 
                (v) => {
                    item[field] = v
                    if(onchange) onchange(v)
                } : 
                (v) => {
                    item[field] = v[0]
                    if(onchange) onchange(v[0])
                },
            checkboxClass: `${inline ? "col s3 " : ""}${checkboxClass}` ,   
            inline
        }

        return isRadio ? 
            m(RadioButtons, <IRadioButtons>opts) : 
            m(Select, <ISelectOptions>opts)
    }
}

export var BoolEdit: m.Component<any> = {
    view: (vnode) => {
        const {checkboxClass, className, disabled, field, 
            inline, isRadio, item, label, labelFalse, labelTrue, onchange, required} = vnode.attrs
        
        var opts = { 
            disabled,
            className, 
            label, 
            inline, 
            checkboxClass: `${inline ? "col s2 " : ""}${checkboxClass}` ,   
            required: required || false,   
            options: [{id: 'true', label: labelTrue || 'Yes'}, {id: 'false', label: labelFalse || 'No' }],
            checked: item[field],
            checkedId: String(item[field]),
            onchange: (v) => {
                item[field] = typeof v == 'string' ? v == 'true' : v
                if(onchange) onchange(item[field])
            },
        }

        return isRadio ? 
            m(RadioButtons, <IRadioButtons>opts) : 
            m(InputCheckbox, opts)
    }
}

export var DateTimeEdit: m.Component<any> = {
    view: (vnode) => {
        var required = vnode.attrs.required || false
        var className = vnode.attrs.className
        var labelDate = vnode.attrs.labelDate
        var labelTime = vnode.attrs.labelTime
        var item = vnode.attrs.item
        var field = vnode.attrs.field
        var disabled = vnode.attrs.disabled

        var val : Date = new Date(item[field])

        if(!val) return 

        return m('.row', {className, style: 'padding: 0px'},
            m(DatePicker, {
                disabled,
                required, 
                label: labelDate,
                className: 'col s6', 
                initialValue: new Date(val),
                container: document.body,
                onchange: (v: Date) => { 
                    if(!v) return
                    val.setFullYear(v.getFullYear())
                    val.setMonth(v.getMonth())
                    val.setDate(v.getDate())
                    item[field] = val
                }
            }),
            m(TimePicker, {
                disabled,
                required, 
                label: labelTime,
                className: 'col s6', 
                initialValue: moment(val).format('HH:mm'),
                container: 'body',
                onchange: (v: string) => {
                    var d = moment(v, 'HH:mm');
                    val.setHours(d.hour())
                    val.setMinutes(d.minute())
                    item[field] = val
                }
            }),
        )
    }
}

export var DateEdit: m.Component<any> = {
    view: (vnode) => {
        var required = vnode.attrs.required || false
        var className = vnode.attrs.className
        var label = vnode.attrs.label
        var item = vnode.attrs.item
        var field = vnode.attrs.field
        var disabled = vnode.attrs.disabled

        var val = item[field]

        //if(!val) return 

        return m(DatePicker, {
                disabled,
                required, 
                label,
                className, 
                initialValue: new Date(val),
                container: document.body,
                onchange: (v) => { 
                    item[field] = v
                }
            })
    }
}

interface ICardAttrs {
    title: m.Children,
    body: m.Children,
    action?: m.Children,
    className?: string
}

export var Card: m.Component<ICardAttrs>  = {
    view: (vnode: m.Vnode<ICardAttrs>) => {
        let {title, body, action, className} = vnode.attrs
        return m('.card', {className},
            m('.card-content',
                m('.card-title', title),
                m('.card-body', body),
            ),
            typeof action === 'undefined' ? '' : m('.card-action', action)
        )
    }
}

export enum ColType { Sections, Tabs, Collapsible, Accordion }

interface IContentCollectionAttrs {
    type?: ColType
    items: { 
        title: m.Children,
        body: m.Children,
    }[]
}

export const ContentCollection: m.Component<IContentCollectionAttrs> = {
    view: (vnode: m.Vnode<IContentCollectionAttrs>) => {
        let {type, items} = vnode.attrs
        let accordion = true
        switch(type) {
            case ColType.Collapsible:
                accordion = false
            case ColType.Accordion:
                return m(Collapsible, {
                    accordion,
                    items: items.map(o => ({header: <any>o.title, body: <any>o.body}))
                })
            case ColType.Tabs:
                return m(Tabs, {
                    tabs: items.map(o => ({title: <any>o.title, vnode: <any>o.body}))
                })
            default:
                return m('', items.map(o => m('',
                    m('h6', o.title),
                    o.body
                )))
        }
    }
}
