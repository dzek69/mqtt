import type { ISubscriptionMap } from "mqtt/types/lib/client";

const addPrefix = <T extends string | string[] | ISubscriptionMap>(evt: T, prefix: string): T => {
    if (typeof evt === "string") {
        // @ts-expect-error ts can't handle that, whatever
        return prefix + evt;
    }
    if (Array.isArray(evt)) {
        // @ts-expect-error ts can't handle that, whatever
        return evt.map(ev => prefix + ev);
    }

    const map: ISubscriptionMap = {};
    Object.entries(evt).forEach(([key, val]) => {
        if (typeof val === "boolean") {
            // @ts-expect-error it's fine TS
            map[key] = val;
            return;
        }
        map[prefix + key] = val;
    });
    // @ts-expect-error ts can't handle that, whatever
    return map;
};

const stripPrefix = (evt: string, prefix: string) => {
    if (evt.startsWith(prefix)) {
        return evt.substr(prefix.length);
    }
    return evt;
};

const attachPrefix = (prefix: string, value: string) => {
    if (value.startsWith("/")) { // don't add prefix if starting with /
        return value.substr(1);
    }
    return prefix + value;
};

export {
    addPrefix,
    stripPrefix,
    attachPrefix,
};
