import {BaseVm} from './common'

class ErrorVm extends BaseVm {
    message: string
    constructor(path: string) {
        super()
        this.path = [
            {ref: `/`, title: 'Home'},
            {ref: `/${path}`, title: '404'},
        ]
        let parts = path.split('/')
        if(parts[0] == 'object')
            this.message = `Object ${parts[1]} not found in database`
        else
            this.message = `Path ${path} not found`
    }
}

export {ErrorVm}
