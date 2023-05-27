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

const ModuleName = 'carportService';

interface IGarageControl {
    button: Line;
    state: Line;
}

const enum GPIOState {
    LOW = 0,
    HIGH = 1
};

const enum GPIOConfig {
    Output = 0,
    Input = 1
};

interface IGarageControllerSpec {
    buttonPin: number;
    buttonPinConfig: GPIOConfig;
    statePin: number;
    statePinConfig: GPIOConfig;
}

const GarageControllersSpecs: IGarageControllerSpec[] = [
    {
        buttonPin: 16,
        buttonPinConfig: GPIOConfig.Output,
        statePin: 17,
        statePinConfig: GPIOConfig.Input
    },
    {
        buttonPin: 22,
        buttonPinConfig: GPIOConfig.Output,
        statePin: 23,
        statePinConfig: GPIOConfig.Input
    },
    {
        buttonPin: 24,
        buttonPinConfig: GPIOConfig.Output,
        statePin: 25,
        statePinConfig: GPIOConfig.Input
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
                garageControllerSpec.buttonPinConfig == GPIOConfig.Output
                    ? button.requestOutputMode()
                    : button.requestInputMode();

                const state = new Line(this.bcm2835, garageControllerSpec.statePin);
                garageControllerSpec.statePinConfig == GPIOConfig.Output
                    ? state.requestOutputMode()
                    : state.requestInputMode();

                this.garageControllers.push({
                    button,
                    state
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

    public async open(garageDoorId: GarageDoorId): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (this.gpioAvailable) {
            this.server.log([ModuleName, 'info'], `Setting GPIO pin to HIGH`);

            this.garageControllers[garageDoorId].button.setValue(GPIOState.HIGH);

            status = CarPortStatus.Open;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }

    public async close(garageDoorId: GarageDoorId): Promise<CarPortStatus> {
        let status = CarPortStatus.Unknown;

        if (this.gpioAvailable) {
            this.server.log([ModuleName, 'info'], `Setting GPIO pin to LOW`);

            this.garageControllers[garageDoorId].button.setValue(GPIOState.LOW);

            status = CarPortStatus.Closed;
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

            const value = this.garageControllers[garageDoorId].button.getValue();

            status = value === GPIOState.HIGH ? CarPortStatus.Open : CarPortStatus.Closed;
        }
        else {
            this.server.log([ModuleName, 'info'], `GPIO access is unavailable`);
        }

        return status;
    }
}
