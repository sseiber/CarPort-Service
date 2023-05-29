export enum GarageDoorId {
    GarageDoor1 = 0,
    GarageDoor2 = 1,
    GarageDoor3 = 2
}

export enum CarPortStatus {
    Unknown = 'unknown',
    Open = 'open',
    Closed = 'closed'
}

export interface ICarPortStatus {
    status: CarPortStatus;
}

export enum CarPortAction {
    Activate = 'activate',
    Open = 'open',
    Close = 'close',
    Check = 'check'
}

export interface ICarPortServiceRequest {
    garageDoorId: GarageDoorId;
    action: CarPortAction;
}

export interface ICarPortServiceResponse {
    succeeded: boolean;
    message: string;
    status: CarPortStatus;
}
