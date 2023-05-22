import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';

const ModuleName = 'carportService';

@service(ModuleName)
export class CarPortService {
    @inject('$server')
    private server: Server;

    public async init(): Promise<void> {
        this.server.log([ModuleName, 'info'], `${ModuleName} initialzation`);
    }

    public async control(_domainProcessorRequest: any): Promise<any> {
        try {
            // await Promise.all(domainProcessorHandlers);

            return {
                succeeded: true,
                processorId: 'loopbox.domainprocessor.none'
            };
        }
        catch (error) {
            this.server.log([ModuleName, 'error'], 'Unexpected result');

            // return default result
            return {
                succeeded: false,
                processorId: 'loopbox.domainprocessor.none'
            };
        }
    }
}
