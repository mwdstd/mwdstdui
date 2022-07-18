import { Qa } from "../types";

interface FlagMapping {
    mnemonic: string
    internal_flag: string | string[]
}

const qa_groups : {mnemonic: string, name: string, flags: FlagMapping[]}[] = [
    {mnemonic: 'HDTRJ', name: 'HD trajectory', flags: [
        {mnemonic: 'VLD', internal_flag: 'ci_vrf'}, 
        {mnemonic: 'FREQ', internal_flag: 'srv_freq'}, 
    ]},
    {mnemonic: 'MSA', name: 'MSA', flags: [
        {mnemonic: 'CONF', internal_flag: 'confidence'}, 
        {mnemonic: 'ACC', internal_flag: 'accuracy'}, 
        {mnemonic: 'SRV#', internal_flag: 'number_of_surveys'}, 
        {mnemonic: 'FSLB', internal_flag: 'correction_possibility'}, 
        {mnemonic: 'EXP', internal_flag: 'model_comparison'}, 
        {mnemonic: 'CONV', internal_flag: ['msa_conv1', 'msa_conv2']}, 
        {mnemonic: 'LNK', internal_flag: 'linking'}, 
    ]},
    {mnemonic: 'SQC', name: 'Survey quality', flags: [
        {mnemonic: 'REF QC', internal_flag: 'reference'}, 
        {mnemonic: 'SRV QC', internal_flag: 'expectation'}, 
        {mnemonic: 'RT QC', internal_flag: 'sq_last'}, 
    ]},
    {mnemonic: 'SAG', name: 'Sag', flags: [
        {mnemonic: 'CONV', internal_flag: 'sag_conv'}, 
        {mnemonic: 'EXP', internal_flag: 'sag_exp'}, 
    ]},
    {mnemonic: 'POS', name: 'Trajectory position', flags: [
        {mnemonic: 'STR QC', internal_flag: 'str_qc'}, 
        {mnemonic: 'PLAN', internal_flag: 'plan'}, 
    ]}
]

const warnings = {
    HDTRJ: {
        "FREQ": "Low density of the continuous inclination data",
        "VLD": "Continuous inclination may not match with static surveys",
    },
    MSA: {
        "ACC": "MSA correction may be inaccurate",
        "FSLB": "Survey toolfaces close to each other for accurate MSA correction",
        "CONV": "MSA correction doesn't converge",
        "SRV#": "MSA algorithm requires more surveys: #",
        "LNK": "The previous run doesn't match with the current run",
        "EXP": "Unexpected MSA correction result",
        "CONF": "Low MSA correction confidence",
    },
    SQC: {
        "REF QC": "Inaccurate gravity/geomagnetic reference or MWD tool issue",
        "SRV QC": "A lot of bad surveys pre-qualified by the user as good",
        "RT QC": "Poor quality of the latest MWD surveys",
    },
    SAG: {
        "CONV": "BHA sag correction doesn't converge",
        "EXP": "BHA sag correction result is too high",
    },
    POS: {
        "STR QC": "MWD surveys do not match with the slide sheet",
        "PLAN": "Actual INC or AZ don't match with the uploaded plan",
    }
}

enum QaResult {
    None = 0,
    Success = 1,
    WeakFailure = 2,
    StrongFailure = 3
}

interface QaTile {
    mnemonic: string
    display_name: string
    result: QaResult
}

export interface QaFlagVm extends QaTile {
    message_template: string
    parameter?: number    
}
export interface QaGroupVm extends QaTile {
    flags: QaFlagVm[]
    issues: string[]
}

export class QaVm {
    groups: QaGroupVm[]
    issues: string[] = []
    constructor(qa: Qa) {
        this.groups = CreateQaVm(qa)
        this.issues = this.groups.map(g => g.issues).flat()
    }
}

function CreateQaVm(qa: Qa): QaGroupVm[] {
    if (!qa) return []
    return qa_groups.map(group => {
        const flags = group.flags.map(fm => {
            const flags = [fm.internal_flag].flat().map(f=> qa[f])
            const ress = flags.map(flag => flag.value == null ? 
                QaResult.None : 
                flag.value ? 
                    QaResult.Success : 
                    flag?.severity > 0 ?
                        QaResult.StrongFailure :
                        QaResult.WeakFailure)
            const result = Math.max(...ress)
            return {
                mnemonic: fm.mnemonic,
                display_name: flags[0]?.name,
                result,
                message_template: result > QaResult.Success ? warnings[group.mnemonic][fm.mnemonic] : ''
            }
        })
        const issues = flags.filter(f => f.message_template).map(f => f.message_template)
        return {
            mnemonic: group.mnemonic,
            display_name: group.name,
            result: Math.max(...flags.map(f => f.result)),
            flags, issues
        }
    })
}
