import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { Gpio } from 'onoff';
import { ICarPortServiceRequest, ICarPortServiceResponse } from '../types/carportTypes';
import { sleep } from '../utils';

const ModuleName = 'carportService';

@service(ModuleName)
export class CarPortService {
    @inject('$server')
    private server: Server;

    public async init(): Promise<void> {
        this.server.log([ModuleName, 'info'], `${ModuleName} initialzation`);
    }

    public async control(controlRequest: ICarPortServiceRequest): Promise<ICarPortServiceResponse> {
        const response: ICarPortServiceResponse = {
            succeeded: true,
            status: 201,
            message: 'The request succeeded'
        };

        try {
            this.server.log([ModuleName, 'info'], `Accessing GPIO pin 17`);

            const led = new Gpio(17, 'out');

            led.writeSync(Gpio.HIGH);
            await sleep(1000);

            led.writeSync(Gpio.LOW);
            await sleep(1000);

            led.writeSync(Gpio.HIGH);
            await sleep(1000);

            led.writeSync(Gpio.LOW);

            led.unexport();

            response.message = `The carport request for action ${controlRequest.action} succeeded`;
        }
        catch (ex) {
            response.succeeded = false;
            response.status = 500;
            response.message = `The carport request for action ${controlRequest.action} failed with exception: ${ex.message}`;

            this.server.log([ModuleName, 'error'], response.message);
        }

        return response;
    }
}
