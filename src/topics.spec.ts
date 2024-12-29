import must from "must";

import { compareTopics } from "./topics";

describe("topics", () => {
    describe("compareTopics", () => {
        it("should return true for simple equality", async () => {
            must(compareTopics("a", "a")).be.true();
            must(compareTopics("cameras/inner", "cameras/inner")).be.true();
        });

        it("should return false for simple inequality", async () => {
            must(compareTopics("a", "b")).be.false();
            must(compareTopics("cameras/inner", "cameras/outer")).be.false();
        });

        it("should return true for one level wildcard", async () => {
            must(compareTopics("+", "a")).be.true();
            must(compareTopics("cameras/+", "cameras/inner")).be.true();
        });

        it("should return false for one level wildcard mismatch", async () => {
            must(compareTopics("+", "a/b")).be.false();
            must(compareTopics("cameras/+", "cameras/inner/outer")).be.false();
        });

        it("should return true for one level wildcard with next level static value", async () => {
            must(compareTopics("a/+/c", "a/b/c")).be.true();
            must(compareTopics("a/+/c", "a/x/c")).be.true();
            must(compareTopics("cameras/+/image", "cameras/inner/image")).be.true();
        });

        it("should return false for one level wildcard with next level static value mismatch", async () => {
            must(compareTopics("a/+/c", "a/b/x")).be.false();
            must(compareTopics("a/+/c", "a/x/x")).be.false();
            must(compareTopics("cameras/+/image", "cameras/inner/x")).be.false();
        });

        it("should return true for multi-level wildcard", async () => {
            must(compareTopics("#", "a")).be.true();
            must(compareTopics("#", "a/b")).be.true();
            must(compareTopics("#", "a/b/c")).be.true();
            must(compareTopics("cameras/#", "cameras/inner")).be.true();
            must(compareTopics("cameras/#", "cameras/inner/image")).be.true();
        });
    });
});
