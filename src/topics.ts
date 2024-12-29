import type { ISubscriptionMap } from "mqtt/types/lib/client";

const getTopics = (topic: string | string[] | ISubscriptionMap) => {
    if (typeof topic === "string") {
        return [topic];
    }
    if (Array.isArray(topic)) {
        return topic;
    }
    return Object.keys(topic);
};

const compareTopics = (pattern: string, topic: string) => {
    const patternSegments = pattern.split("/");
    const topicSegments = topic.split("/");

    for (let i = 0; i < patternSegments.length; i++) {
        if (patternSegments[i] === "#") { return true; }
        if (patternSegments[i] !== "+" && patternSegments[i] !== topicSegments[i]) { return false; }
    }

    return patternSegments.length === topicSegments.length;
};

export {
    getTopics,
    compareTopics,
};
