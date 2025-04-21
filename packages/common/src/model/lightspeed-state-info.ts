export enum LightspeedState {
  INITIALIZING = 'INITIALIZING',
  STARTING = 'STARTING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface LightspeedStateInfo {
  status: LightspeedState;
  error?: string;
}
