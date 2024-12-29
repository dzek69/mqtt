# Easy `mqtt` wrapper

An `mqtt` package wrapper that adds features I feel that should be part of the original package.

I have little time for development, so this is incomplete, not every function is wrapper properly, so be careful.

## Features

### Topic-based subscriptions
With bare `mqtt` library you have to do this:
```typescript
client.subscribe("mytopic", (err) => {
    if (err) {
        // handle the error
        return;
    }
    client.on("message", (topic, message) => {
        if (topic === "mytopic") {
            // do something with the message
        }
    });
});

client.subscribe("other", (err) => {
    if (err) {
        // handle the error
        return;
    }
    client.on("message", (topic, message) => {
        if (topic === "other") {
            // do something else
        }
    });
});

// or use one `client.on("message")` and still filter topic manually
```

With this lib you can:
```typescript
client.sub("mytopic", (message) => {
    // do something with the message
});
client.sub("other", (message) => {
    // do something else
});
```

Amazing, isn't it?

Of course if you want to handle two different topic with the same callback you can do the usual:
```typescript
client.sub(["mytopic", "other"], (message) => {
    // do something with both topics
});
```

This function also explicitly throws when subscription fails, so you avoid unnoticed errors in your app.

To stop receiving messages from a topic you can super easily unsubscribe from it:
```typescript
const unsubscribe = client.sub("mytopic", (message) => {
    // do something with the message
});

setTimeout(unsubscribe, 5000); // stop receiving messages after 5 seconds
```

### Topic prefix

If you are developing and running production app on a single `mqtt` instance you may want to prefix all your topics with
something, so you can easily switch between different instances. This lib allows you to do that:
```typescript
const client = createMQTT(process.env.MQTT_CONNECTION_STRING, "test");

client.publish("mytopic", "message"); // will publish to "test/mytopic"
```

Subscribing will also subscribe you into prefixed topics, and they will be stripped when you receive a message.
```typescript
client.on("message", (topic, message) => {
    console.log(topic); // will print "mytopic" if something was published to "test/mytopic"
});
```

### Increased modularity by requiring to unsubscribe as many times as you subscribed
With bare `mqtt` library if you subscribe to a topic twice (ie. two different modules of your app) and you unsubscribe
once, you will stop receiving messages from that topic (one of your module will "broke").
This is patched with `@ezez/mqtt` and now you are required you to unsubscribe as many times as you subscribed to stop
receiving messages.

### Additional utils
With MQTT (protocol, not the library) you can't read when the message was published, this is especially painful with
retained messages (I store i.e. current temperature as retained, so I can always immediately access it, but I also need
to know how up to date this information is). So I usually post my messages with a timestamp.

I also make other parts of my app or related devices to post heartbeats to a topic, so I know they are still alive.

There are two functions that can help you with that:
- `now` function publishes current timestamp to a topic
- `publishNow` function expects an object and adds a timestamp to it as a `time` property before publishing

## Getting started

Instead of importing `mqtt` library and calling `mqtt.connect` you should use `createMQTT` function from this package.

```typescript
import { createMQTT } from "@ezez/mqtt";

const client = createMQTT(process.env.MQTT_CONNECTION_STRING, optionalPrefix, optionalOptions);
```

Then use the usual features or the new ones on the `client`.

### License

MIT

### Other

Versions prior to 3.0.0 were published as `@dzek69/mqtt` and now are deprecated.
