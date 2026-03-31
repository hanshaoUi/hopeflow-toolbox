// Development mode configuration
// Keep this file side-effect free. Do not inject mock activation state here.
export const DEV_MODE: boolean = (typeof __HOPEFLOW_DEV_MODE__ !== 'undefined')
    ? __HOPEFLOW_DEV_MODE__
    : false;

// Development builds can read this shape if needed, but it must never imply paid access.
export const DEV_LICENSE_STATUS = {
    isActivated: false,
    plan: '' as const,
    expiresAt: '',
    remainingDays: 0,
    maxMachines: 0,
    maxConcurrent: 0,
    serverScriptIds: [],
    offlineMode: false,
};
