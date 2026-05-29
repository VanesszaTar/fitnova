import { createPlan, updatePlan, deletePlan, activatePlan } from './api'

let pendingOps = []

export function queueOperation(type, payload) {
    const op = {
        id: Date.now(),
        type,
        payload,
        timestamp: new Date().toISOString()
    }
    pendingOps.push(op)
    return op.id
}

export function getPendingOps() {
    return [...pendingOps]
}

export function hasPendingOps(){
    return pendingOps.length > 0
}

export async function syncWithServer(onSuccess, onError) {
    if (pendingOps.length === 0) return

    const ops = [...pendingOps]
    const failed = [] 

    for (const op of ops) {
        try {
            switch (op.type) {
                case 'CREATE_PLAN':
                    await createPlan(op.payload)
                    break
                case 'UPDATE_PLAN':
                    await updatePlan(op.payload.id, op.payload)
                    break
                case 'DELETE_PLAN':
                    await deletePlan(op.payload.id)
                    break
                case 'ACTIVATE_PLAN':
                    await activatePlan(op.payload.id)
                    break
                default:
                    break
            }
            if (onSuccess) onSuccess(op)
        } catch (err) {
            failed.push(op)
            if (onError) onError(op, err)
        }
    }
    pendingOps = failed
}

export function clearPendingOps() {
    pendingOps = [] 
}