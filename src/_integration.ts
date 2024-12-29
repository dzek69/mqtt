/* eslint-disable no-console */
import { createMQTT } from "./index.js";

const mqtt = createMQTT(process.env.MQTT_CONNECTION_STRING!, "test/");

process.on("uncaughtException", (reason) => {
    console.error("UNCAUGHT!!!", reason);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
});

mqtt.on("connect", () => {
    mqtt.now("connect");
    console.log("connect");
});
mqtt.on("reconnect", () => {
    mqtt.now("reconnect");
    console.log("reconnect");
});
mqtt.on("disconnect", () => {
    mqtt.now("disconnect");
    console.log("disconnect");
});
mqtt.on("close", () => {
    mqtt.now("close");
    console.log("close");
});
mqtt.on("error", (e) => {
    mqtt.now("error");
    console.log("error", e);
});

console.log("now");

// mqtt.publish("wololo", "lolo");
// mqtt.publishNow("wololo", { x: "d" });

mqtt.subscribe("#", (err) => {
    console.log("#", err);
});
mqtt.on("message", (topic, payload) => {
    if (topic.includes("o-0")) {
        console.log("message", topic);
    }
});
