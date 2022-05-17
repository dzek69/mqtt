import mqtt from "mqtt";
import type { MqttClient, IClientPublishOptions } from "mqtt";
import type { OnMessageCallback, ISubscriptionMap } from "mqtt/types/lib/client";

interface MyMQTT extends MqttClient {
    now: (event: string, opts?: IClientPublishOptions) => void;
    publishNow: (event: string, data: object, opts?: IClientPublishOptions) => void;
}

const addPrefix = (event: string | string[] | ISubscriptionMap, prefix: string) => {
    if (typeof event === "string") {
        return prefix + event;
    }
    if (Array.isArray(event)) {
        return event.map(ev => prefix + ev);
    }

    const map: ISubscriptionMap = {};
    Object.entries(event).forEach(([key, val]) => {
        map[prefix + key] = val;
    });
    return map;
};

const stripPrefix = (event: string, prefix: string) => {
    if (event.startsWith(prefix)) {
        return event.substr(prefix.length);
    }
    return event;
};

const attachPrefix = (prefix: string, value: string) => {
    if (value.startsWith("/")) { // don't add prefix if starting with /
        return value.substr(1);
    }
    return prefix + value;
};

// eslint-disable-next-line max-lines-per-function
const createMQTT = (conString: string, prefix = "") => {
    const connection = mqtt.connect(conString) as unknown as MyMQTT;
    let p = prefix ? prefix : "";
    if (p && !p.endsWith("/")) {
        p += "/";
    }

    connection.now = (event, opts) => connection.publish(
        attachPrefix(p, event), String(Date.now()), opts!,
    ); // this ! shouldn't be here, but TS...
    connection.publishNow = (event, data, opts) => {
        connection.publish(attachPrefix(p, event), JSON.stringify({
            ...data,
            time: Date.now(),
        }), opts!);
    }; // this ! shouldn't be here, but TS...

    if (prefix) {
        // @TODO this requires all methods to be wrapped
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const originalOn = connection.on;
        connection.on = function on(event, callback) {
            if (event === "message") {
                const prefixedCallback: OnMessageCallback = function(topic, payload, packet) {
                    // @TODO verify context on callbacks
                    (callback as OnMessageCallback).call(null, stripPrefix(topic, p), payload, packet);
                };
                originalOn.call(this, event, prefixedCallback);
                return this;
            }
            originalOn.call(this, event, callback);
            return this;
        };

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const originalOnce = connection.once;
        connection.once = function once(event, callback) {
            if (event === "message") {
                const prefixedCallback: OnMessageCallback = function(topic, payload, packet) {
                    // @TODO verify context on callbacks
                    (callback as OnMessageCallback).call(null, stripPrefix(topic, p), payload, packet);
                };
                originalOnce.call(this, event, prefixedCallback);
                return this;
            }
            originalOnce.call(this, event, callback);
            return this;
        };

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const originalSubscribe = connection.subscribe;
        connection.subscribe = function subscribe(topic, optsOrCallback, maybeCallback?) {
            const prefixedTopic = addPrefix(topic, p);
            if (maybeCallback) {
                // @ts-expect-error Idk why TS mess this up
                originalSubscribe.call(this, prefixedTopic, optsOrCallback, maybeCallback);
            }
            else {
                // @ts-expect-error Idk why TS mess this up
                originalSubscribe.call(this, prefixedTopic, optsOrCallback);
            }
            return this;
        };
    }

    return connection;
};

export {
    createMQTT,
};

export type {
    MyMQTT,
};
