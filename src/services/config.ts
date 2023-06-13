import { service, inject } from 'spryly';
import { Server } from '@hapi/hapi';
import { resolve as pathResolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

const ModuleName = 'config';

@service(ModuleName)
export class ConfigService {
    @inject('$server')
    private server: Server;

    public async init(): Promise<void> {
        this.server.log([ModuleName, 'info'], `${ModuleName} initialization`);

        dotenvConfig({
            path: `${pathResolve(__dirname, '..', '..', 'configs', 'envConfig')}.env`
        });
    }

    public get(configItem: string): any {
        return process.env[configItem];
    }
}
