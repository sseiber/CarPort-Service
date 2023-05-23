export interface ICarPortServiceRequest {
    action: string;
}

export interface ICarPortServiceResponse {
    succeeded: boolean;
    status: number;
    message: string;
}
