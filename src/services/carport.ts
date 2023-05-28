import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import {
    CarPortAction,
    CarPortStatus,
    GarageDoorId,
    ICarPortServiceRequest,
    ICarPortServiceResponse
} from '../models/carportTypes';
import { version, Chip, Line, available } from 'node-libgpiod';
import { sleep } from '../utils';

const ModuleName = 'carportService';

interface IGarageControl {
    button: Line;
    downState: Line;
    upState: Line;
}

const enum GPIOState {
    LOW = 0,
    HIGH = 1
};

interface IGarageControllerSpec {
    buttonPin: number;
    downStatePin: number;
    upStatePin: number;
}

const GarageControllersSpecs: IGarageControllerSpec[] = [
    {
        buttonPin: 16,
        downStatePin: 0,
        upStatePin: 3
    },
    {
        buttonPin: 18,
        downStatePin: 1,
        upStatePin: 4
    },
    {
        buttonPin: 19,
        downStatePin: 2,
        upStatePin: 5
    },
]

@service(ModuleName)
export class CarPortService {
    @inject('$server')
    private server: Server;

    private gpioAvailable: boolean;
    private bcm2835: Chip;
    private garageControllers: IGarageControl[];

    public async init(): Promise<void> {
        this.server.log([ModuleName, 'info'], `${ModuleName} initialzation: libgpiod version: ${version}, status: ${available() ? 'available' : 'unavailable'}`);

        this.garageControllers = [];

        try {
            this.gpioAvailable = available();

            this.bcm2835 = new Chip(0);

            for (const garageControllerSpec of GarageControllersSpecs) {
                const button = new Line(this.bcm2835, garageControllerSpec.buttonPin);
                button.requestOutputMode();

                const downState = new Line(this.bcm2835, garageControllerSpec.downStatePin);
                downState.requestInputMode();

                const upState = new Line(this.bcm2835, garageControllerSpec.upStatePin);
                upState.requestInputMode();

                this.garageControllers.push({
                    button,
                    downState,
                    upState
                });
            }
        }
        catch (ex) {
            this.server.log([ModuleName, 'error'], `An error occurred initializing the libgpiod library: ${ex.message}`);
        }
    }

    public async control(controlRequest: ICarPortServiceRequest): Promise<ICarPortServiceResponse> {
        const response: ICarPortServiceResponse = {
            succeeded: true,
            message: 'The request succeeded',
            status: CarPortStatus.Unknown
        };

        this.server.log([ModuleName, 'info'], `Carport request for garageDoorId ${controlRequest.garageDoorId}, action ${controlRequest.action.action} was received`);

        try {
            let message;

            switch (controlRequest.action.action) {
                case CarPortAction.Activate:
                    response.status = await this.activate(controlRequest.garageDoorId);
                    break;

                case CarPortAction.Open:
                    response.status = await this.open(controlRequest.garageDoorId);
                    break;

                case CarPortAction.Close:
                    response.status = await this.close(controlRequest.garageDoorId);
                    break;

                case CarPortAction.Check:
                    response.status = await this.check(controlRequest.garageDoorId);
                    break;

                default:
                    message = `Carport request for garageDoorId ${controlRequest.garageDoorId}, action ${controlRequest.action.action} is not recognized`;
                    break;
            }

            response.message = message || `Carport request for garageDoorId ${controlRequest.garageDoorId}, action ${controlRequest.action.action} was processed with status ${response.status}`;

            this.server.log([ModuleName, 'info'], response.message);
        }
        catch (ex) {
            response.succeeded = false;
            response.message = `Carport request for garageDoorId ${controlRequest.garageDoorId}, action ${controlRequest.action.action} failed with exception: ${ex.message}`;

            this.server.log([ModuleName, 'error'], response.message);
        }

        return response;
    }

    public async activate(garageDoorId: GarageDoorId): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (this.gpioAvailable) {
            await this.activateGarageDoorButton(garageDoorId);

            status = CarPortStatus.Unknown;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }

    public async open(garageDoorId: GarageDoorId): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (this.gpioAvailable) {
            await this.activateGarageDoorButton(garageDoorId);

            status = CarPortStatus.Unknown;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }

    public async close(garageDoorId: GarageDoorId): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (this.gpioAvailable) {
            await this.activateGarageDoorButton(garageDoorId);

            status = CarPortStatus.Unknown;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }

    public async check(garageDoorId: GarageDoorId): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (this.gpioAvailable) {
            this.server.log([ModuleName, 'info'], `Reading GPIO value`);

            const value = this.garageControllers[garageDoorId].downState.getValue();
            this.server.log([ModuleName, 'info'], `GPIO pin state: ${value}`);

            status = value === GPIOState.HIGH ? CarPortStatus.Closed : CarPortStatus.Open;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }

    private async activateGarageDoorButton(garageDoorId: GarageDoorId): Promise<void> {
        try {
            this.server.log([ModuleName, 'info'], `Activating GPIO pin ${GarageControllersSpecs[garageDoorId].buttonPin} for garageDoorId ${garageDoorId}`);

            this.garageControllers[garageDoorId].button.setValue(GPIOState.HIGH);
            await sleep(500);
            this.garageControllers[garageDoorId].button.setValue(GPIOState.LOW);
        }
        catch (ex) {
            this.server.log([ModuleName, 'info'], `Error activating garage door button: ${ex.message}`);
        }
    }
}
