import type { ISubscriptionMap } from "mqtt/types/lib/client";

import { getTopics } from "./topics.js";

const topicList: Record<string, number> = {};

const increase = (topic: string | string[] | ISubscriptionMap) => {
    const topics = getTopics(topic);
    topics.forEach(t => {
        if (!topicList[t]) {
            topicList[t] = 0;
        }
        topicList[t] += 1;
    });
};

const decrease = (topic: string | string[]) => {
    const topics = getTopics(topic);
    topics.forEach(t => {
        if (!topicList[t]) {
            throw new Error(
                `Topic ${t} not found in topic list count, are you trying `
                + `to unsubscribe from a topic that was never subscribed to?`,
            );
        }
        topicList[t] -= 1;
    });
    return topics.filter(t => topicList[t] === 0);
};

export {
    increase,
    decrease,
};
