import { thomsonCrossSectionDependencies } from 'mathjs'
import m from 'mithril'
import { DialogService } from "../dialog"
import { UserModel } from "../models"
import { AxisInv, AxisMap } from "../types"
import { BaseVm } from "./common"

const usMap = {
    metric: {
        length: 'm',
        diameter: 'mm',
        density: 'g/ml',
        mass: 'kg',
        temperature: 'degC',
        dls_interval: 30
    },
    imperial: {
        length: 'ft',
        diameter: 'in',
        density: 'lb/gal',
        mass: 'lb',
        temperature: 'degF',
        dls_interval: 100
    }
}

const toolMap: {[k: string]: {
    acceleration: string
    magind: string
    gaxes: AxisMap
    maxes: AxisMap
    gaxesi: AxisInv
    maxesi: AxisInv
}} = {
    standard: {
        acceleration: 'm/s^2',
        magind: 'nT',
        gaxes: ['X', 'Y', 'Z'],
        maxes: ['X', 'Y', 'Z'],
        gaxesi: [false, false, false],
        maxesi: [false, false, false]
    },
    standardigxy: {
        acceleration: 'm/s^2',
        magind: 'nT',
        gaxes: ['X', 'Y', 'Z'],
        maxes: ['X', 'Y', 'Z'],
        gaxesi: [true, true, false],
        maxesi: [false, false, false]
    },
    schlumberger: {
        acceleration: 'mgn',
        magind: 'nT',
        gaxes: ['Z', 'Y', 'X'],
        maxes: ['Z', 'Y', 'X'],
        gaxesi: [true, false, false],
        maxesi: [true, false, false]
    },
    halliburton: {
        acceleration: 'gn',
        magind: 'nT',
        gaxes: ['X', 'Y', 'Z'],
        maxes: ['X', 'Y', 'Z'],
        gaxesi: [false, false, false],
        maxesi: [false, false, false]
    }
}

export class UserSettingsVm extends BaseVm {
    ustype = 'metric'
    tooltype = 'standard'
    old_password: string
    new_password: string
    confirm_password: string
    constructor() {
        super()
        this.path = [
            {ref: `/`, title: 'Home'},
            {ref: `/settings`, title: 'Settings'}
        ]
    }
    protected async initialize(): Promise<void> {
        await super.initialize()
        this.ustype = this.user.us.length == 'ft' ? 'imperial' : 'metric'
        this.tooltype = this.user.us.acceleration == 'gn' ? 
            'halliburton' :
            this.user.us.acceleration == 'mgn' ?
                'schlumberger' :
                this.user.us.gaxesi[0] ? 
                    'standardigxy' :
                    'standard'
    }

    async changePassword() {
        try {
            await UserModel.changeMyPassword(this.old_password, this.new_password)
            this.old_password = null
            this.new_password = null
            this.confirm_password = null
            m.redraw()
        } catch (e) {
            DialogService.showError(e)
        }
    }

    async setUnitSystem() {
        const newUs = {
            ...this.user.us,
            ...usMap[this.ustype]
        }
        try {
            await UserModel.setMyUs(newUs)
            this.user.us = newUs
            m.redraw()
        } catch (e) {
            DialogService.showError(e)
        }
    }
    async setToolType() {
        const newUs = {
            ...this.user.us,
            ...toolMap[this.tooltype]
        }
        try {
            await UserModel.setMyUs(newUs)
            this.user.us = newUs
            m.redraw()
        } catch (e) {
            DialogService.showError(e)
        }
    }
}