declare module 'winston-datadog-transport' {
    import { TransportStreamOptions } from 'winston-transport';

    interface DatadogTransportOptions extends TransportStreamOptions {
        apiKey?: string;
        hostname?: string;
        service?: string;
        ddsource?: string;
        ddtags?: string;
        intakeRegion?: string;
    }

    class DatadogTransport {
        constructor(options?: DatadogTransportOptions);
    }

    export = DatadogTransport;
}
