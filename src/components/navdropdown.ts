import m, { Component, Attributes } from 'mithril';
import { uniqueId } from 'mithril-materialized';

export interface IDropdownOption {
  label: string;
  iconName?: string;
  divider?: boolean;
  onclick?: () => void
}

export interface INavDropdownOptions extends Partial<M.DropdownOptions>, Attributes {
  label?: string;
  items: IDropdownOption[];
  iconName?: string;
}

/** NavDropdown component */
export const NavDropdown = (): Component<INavDropdownOptions> => {
  const state = {} as {
    id: string;
  };
  return {
    oninit: ({ attrs: { id = uniqueId() }}) => {
      state.id = id;
    },
    view: ({ attrs: {
      label,
      items,
      iconName,
      coverTrigger = false,
      constrainWidth = false,
      ...props
    } }) => {
      const { id } = state;
      return [
        m(
          `a.dropdown-trigger[href=#][data-target=${id}]`,
          {
            oncreate: ({ dom }) => {
              M.Dropdown.init(dom, {...props, constrainWidth, coverTrigger});
            },
          },
          iconName ? m('i.material-icons.left', iconName) : undefined,
          label,
          m('i.material-icons.right', 'arrow_drop_down')
        ),
        m(
          `ul.dropdown-content[id=${id}]`,
          items.map(i =>
            m(
              `li${i.divider ? '.divider[tabindex=-1]' : ''}`,
              i.divider
                ? undefined
                : m(
                    'a', { onclick: i.onclick },
                    [i.iconName ? m('i.material-icons', i.iconName) : undefined, i.label]
                  )
            )
          )
        ),
      ]
    },
  };
};