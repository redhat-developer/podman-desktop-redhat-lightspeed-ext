export enum LightspeedState {
  INITIALIZING = 'INITIALIZING',
  STARTING = 'STARTING',
  READY = 'READY',
  ERROR_ENTITLEMENT = 'ERROR_ENTITLEMENT',
  ERROR = 'ERROR',
}

export interface LightspeedStateInfo {
  status: LightspeedState;
  error?: string;
}
