export enum CarPortStatus {
    Unknown = 'unknown',
    Open = 'open',
    Closed = 'closed'
}

export interface ICarPortStatus {
    status: CarPortStatus;
}

export enum CarPortAction {
    Open = 'open',
    Close = 'close',
    Check = 'check'
}

export interface ICarPortAction {
    action: CarPortAction;
}

export interface ICarPortServiceRequest {
    action: ICarPortAction;
}

export interface ICarPortServiceResponse {
    succeeded: boolean;
    message: string;
    status: CarPortStatus;
}
