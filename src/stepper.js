import m from 'mithril'

function handleStepError(e) {
    var inputs = e.target.querySelectorAll('.active input, textarea, select')
    inputs.forEach(element => {
        element.reportValidity()
    })
    let dataGridButtons = e.target.querySelectorAll(':not(.step-actions) > button[type=submit]')
    dataGridButtons.forEach(b => {b.className += ' red'})
    e.target.querySelectorAll('.active .message').forEach(b => {b.classList.remove('hide')})
    
    // Defines a function to be binded to any change in any input
    const removeWrongOnInput = () => {
       // If there's a change, removes the WRONGSTEP class
       e.target.querySelectorAll('.active .message').forEach(b => {b.classList.add('hide')})
       // Unbinds the listener from the element
       MStepper.removeMultipleEventListeners(inputs, 'input', removeWrongOnInput);
    };
    // Binds the removeWrongOnInput function to the inputs, listening to the event 'input'
    MStepper.addMultipleEventListeners(inputs, 'input', removeWrongOnInput);
}

function defaultValidator(stepperForm, activeStepContent) {
    let dataGridButtons = activeStepContent.querySelectorAll(':not(.step-actions) > button[type=submit]')
    let hasDataGridInEditMode = dataGridButtons.length > 0
    return MStepper.defaultValidationFunction(stepperForm, activeStepContent) && !hasDataGridInEditMode
}

function handleStepClose(e) {
    const step = e.target.querySelector('.step.active')
    step.previousSibling?.classList.remove('wrong')
}


export var Stepper = () => {
    var stepperInstace 
    var steps 

    function handleSubmitClick(e) {
        let steps = stepperInstace.getSteps().steps
        for(let i = 0; i < steps.length; i++) {
            let val = stepperInstace.options.validationFunction(stepperInstace.form, steps[i].querySelector('.step-content'));
            if (!val) {
                e.preventDefault()
                stepperInstace.openStep(i)
                setTimeout(() => {stepperInstace.wrongStep()}, 500)
                break
            }
        }
    }


    var createValidator = (steps) => {
        return (stepperForm, activeStepContent) => {
            let idx = stepperInstace.getSteps().active.index
            if(steps[idx].validate) 
                return defaultValidator(stepperForm, activeStepContent) && steps[idx].validate()
            return defaultValidator(stepperForm, activeStepContent)
        }
    }
    return { 
        oncreate: (vnode) => {
            steps = vnode.attrs.steps
            stepperInstace = new MStepper(vnode.dom, {validationFunction: createValidator(steps)})
            vnode.dom.addEventListener('steperror', handleStepError)
            if(vnode.attrs.linear)
                vnode.dom.addEventListener('stepclose', handleStepClose)
        },
        view: (vnode) => {
            var steps = vnode.attrs.steps
            var linCls = vnode.attrs.linear ? '.linear' : ''
            var editMode = vnode.attrs.editMode
            return m(`ul.stepper.horizontal${linCls}[style="min-height:658px"]`, 
                steps.map((s, i) => 
                    m('li.step', [
                        m('.step-title.waves-effect', {'data-step-label': s.label}, s.title),
                        m('.step-content', [
                            s.content,
                            m('.step-actions',
                                editMode ? m('button.waves-effect.waves-dark.btn[type="submit"]', {onclick: handleSubmitClick}, 'Submit') : [
                                i == steps.length - 1 ? 
                                    m('button.waves-effect.waves-dark.btn[type="submit"]', {onclick: handleSubmitClick}, 'Submit') : 
                                    m('button.waves-effect.waves-dark.btn.next-step', 'Continue'),
                                i == 0 ? '' : m('button.waves-effect.waves-dark.btn-flat.previous-step', 'Back'), 
                                ]
                            ),
                        ]),
                    ])
                )
            )
        }
    }
}