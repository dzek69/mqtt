import mqtt from "mqtt";

import type { ISubscriptionMap, OnMessageCallback } from "mqtt/types/lib/client";
import type { MqttClient, IClientPublishOptions, IClientOptions, IClientSubscribeOptions } from "mqtt";

import { addPrefix, attachPrefix, stripPrefix } from "./prefixes.js";
import { decrease, increase } from "./count.js";
import { compareTopics, getTopics } from "./topics.js";

type SubCallback = (msgTopic: string, data: Buffer) => void;
type VoidFn = () => void;

interface EzezMQTT extends MqttClient {
    now: (evt: string, opts?: IClientPublishOptions) => void;
    publishNow: (evt: string, data: object, opts?: IClientPublishOptions) => void;
    sub: ((topic: string | string[] | ISubscriptionMap, callback: SubCallback) => VoidFn)
        & ((topic: string | string[], callback: SubCallback, opts?: IClientSubscribeOptions) => VoidFn);
}

// eslint-disable-next-line max-lines-per-function,max-statements
const createMQTT = (conString: string, prefix = "", options?: IClientOptions) => {
    const connection = mqtt.connect(conString, options) as unknown as EzezMQTT;
    let p = prefix ? prefix : "";
    if (p && !p.endsWith("/")) {
        p += "/";
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalPublish = connection.publish;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalOn = connection.on;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalOnce = connection.once;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalSubscribe = connection.subscribe;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalUnsubscribe = connection.unsubscribe;

    connection.publish = function publish(topic, ...args) {
        // @ts-expect-error ts can't handle that, whatever
        return originalPublish.apply(this, [attachPrefix(p, topic), ...args]);
    };

    connection.now = (evt, opts) => connection.publish(
        evt, String(Date.now()), opts, // this ! shouldn't be here, but TS...
    );
    connection.publishNow = (evt, data, opts) => {
        connection.publish(evt, JSON.stringify({
            ...data,
            time: Date.now(),
        }), opts); // this ! shouldn't be here, but TS...
    };

    if (prefix) {
        // @TODO this requires all methods to be wrapped
        connection.on = function on(evt, callback) {
            if (evt === "message") {
                const prefixedCallback: OnMessageCallback = function(topic, payload, packet) {
                    // @TODO verify context on callbacks
                    (callback as OnMessageCallback).call(null, stripPrefix(topic, p), payload, packet);
                };
                // @ts-expect-error ts can't handle that
                originalOn.call(this, evt, prefixedCallback);
                return this;
            }
            originalOn.call(this, evt, callback);
            return this;
        };

        connection.once = function once(evt, callback) {
            if (evt === "message") {
                const prefixedCallback: OnMessageCallback = function(topic, payload, packet) {
                    // @TODO verify context on callbacks
                    (callback as OnMessageCallback).call(null, stripPrefix(topic, p), payload, packet);
                };
                // @ts-expect-error ts can't handle that
                originalOnce.call(this, evt, prefixedCallback);
                return this;
            }
            originalOnce.call(this, evt, callback);
            return this;
        };

        // @ts-expect-error ts can't handle that
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

        connection.unsubscribe = function unsubscribe(topic, ...args) {
            const prefixedTopic = addPrefix(topic, p);
            // @ts-expect-error ts can't handle that
            originalUnsubscribe.call(this, prefixedTopic, ...args);
            return this;
        };
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const prevSubscribe = connection.subscribe;
    connection.subscribe = function subscribe(topic, ...args) {
        increase(topic);
        // @ts-expect-error ts can't handle that
        prevSubscribe.call(this, topic, ...args);
        return this;
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const prevUnsubscribe = connection.unsubscribe;
    connection.unsubscribe = function unsubscribe(topic, ...args) {
        const newTopic = decrease(topic);
        // @ts-expect-error ts can't handle that
        prevUnsubscribe.call(this, newTopic, ...args);
        return this;
    };

    connection.sub = (topic, callback, opts?: IClientSubscribeOptions) => {
        const onMessage: OnMessageCallback = (msgTopic, data) => {
            const topics = getTopics(topic);
            const shouldCall = topics.some(t => compareTopics(t, msgTopic));
            if (shouldCall) {
                // eslint-disable-next-line callback-return
                callback(msgTopic, data);
            }
        };

        const params = [opts, (err: Error | null) => {
            if (err) {
                throw err;
            }
            connection.on("message", onMessage);
        }];

        // @ts-expect-error ts can't handle that
        connection.subscribe(topic, ...params);

        let unsubbed = false;
        return () => {
            if (unsubbed) {
                throw new Error("Already unsubscribed");
            }
            connection.removeListener("message", onMessage);
            connection.unsubscribe(getTopics(topic));
            unsubbed = true;
        };
    };

    return connection;
};

export {
    createMQTT,
};

export type {
    EzezMQTT,
};
