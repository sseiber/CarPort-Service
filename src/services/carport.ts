import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { Gpio } from 'onoff';
import { CarPortAction, CarPortStatus, ICarPortServiceRequest, ICarPortServiceResponse } from '../models/carportTypes';

const ModuleName = 'carportService';

@service(ModuleName)
export class CarPortService {
    @inject('$server')
    private server: Server;

    private led: Gpio;

    public async init(): Promise<void> {
        this.server.log([ModuleName, 'info'], `${ModuleName} initialzation`);

        this.led = new Gpio(17, 'out');
    }

    public async control(controlRequest: ICarPortServiceRequest): Promise<ICarPortServiceResponse> {
        const response: ICarPortServiceResponse = {
            succeeded: true,
            message: 'The request succeeded',
            status: CarPortStatus.Unknown
        };

        this.server.log([ModuleName, 'info'], `Carport request for action ${controlRequest.action.action} was received`);

        try {
            let message;

            switch (controlRequest.action.action) {
                case CarPortAction.Open:
                    response.status = await this.open();
                    break;

                case CarPortAction.Close:
                    response.status = await this.close();
                    break;

                case CarPortAction.Check:
                    response.status = await this.check();
                    break;

                default:
                    message = `Carport request for action ${controlRequest.action.action} is not recognized`;
                    break;
            }

            response.message = message || `Carport request for action ${controlRequest.action.action} was processed with status ${response.status}`;

            this.server.log([ModuleName, 'info'], response.message);
        }
        catch (ex) {
            response.succeeded = false;
            response.message = `Carport request for action ${controlRequest.action.action} failed with exception: ${ex.message}`;

            this.server.log([ModuleName, 'error'], response.message);
        }

        return response;
    }

    public async open(): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (Gpio.accessible) {
            this.server.log([ModuleName, 'info'], `Setting GPIO pin to HIGH`);
            await this.led.write(Gpio.HIGH);

            status = CarPortStatus.Open;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }

    public async close(): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (Gpio.accessible) {
            this.server.log([ModuleName, 'info'], `Setting GPIO pin to LOW`);
            await this.led.write(Gpio.LOW);

            status = CarPortStatus.Closed;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }

    public async check(): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (Gpio.accessible) {
            this.server.log([ModuleName, 'info'], `Reading GPIO value`);

            const value = await this.led.read();
            status = value === Gpio.HIGH ? CarPortStatus.Open : CarPortStatus.Closed;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }
}
