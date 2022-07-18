import m from 'mithril'

export interface IDialogService {
    showError(error: any): void
}

class ModalDialogService implements IDialogService {
    errorModal: M.Modal
    error?: any
    progressModal: M.Modal
    showError(error: any): void {
        this.error = error
        this.errorModal.open()
        m.redraw()
    }
    showProgress() {
        this.progressModal.open()
    }
    hideProgress() {
        this.progressModal.close()
    }
}

export var DialogService = new ModalDialogService()