import { inject, RoutePlugin, route } from 'spryly';
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi';
import {
    badRequest as boom_badRequest
} from '@hapi/boom';
import { CarPortService } from '../services/carport';

export class CarPortRoutes extends RoutePlugin {
    @inject('carportService')
    private carportService: CarPortService;

    @route({
        method: 'POST',
        path: '/api/v1/process/refine',
        options: {
            tags: ['refine'],
            description: 'Refine input'
        }
    })
    public async postProcess(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
        const domainProcessorRequest = request.payload as any;
        if (!domainProcessorRequest.loopBoxIntent) {
            throw boom_badRequest('Expected input in request playload');
        }

        if (!domainProcessorRequest.context) {
            throw boom_badRequest('Expected context in request payload');
        }

        try {
            const refinedInput = await this.carportService.control(domainProcessorRequest);

            return h.response(refinedInput).code(201);
        }
        catch (error) {
            throw boom_badRequest(error.message);
        }
    }
}
