import { ComposeManifest } from 'spryly';

const DefaultPort = 9092;
const PORT = process.env.PORT || process.env.port || process.env.PORT0 || process.env.port0 || DefaultPort;

export function manifest(_config?: any): ComposeManifest {
    return {
        server: {
            port: PORT,
            app: {
                slogan: 'LoopBox input processor service'
            }
        },
        services: [
            './services'
        ],
        plugins: [
            ...[
                {
                    plugin: './apis'
                }
            ]
        ]
    };
}
