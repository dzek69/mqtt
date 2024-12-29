All notable changes to this project will be documented in this file.

The format is based on [EZEZ Changelog](https://ezez.dev/changelog/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [UNRELEASED]
(nothing yet)

## [3.0.0] - 2024-12-29
### Breaking
- subscribing now requires the same amount of unsubscribing to stop receiving messages
### Added
- `sub` function to easily subscribe to given topic
### Dev
- ts library template version bump
- mqtt ^5 now allowed as peer dep

## [2.0.0] - 2022-10-14
### Breaking
- `publish` will add the prefix as well, not only `now` and `publishNow`

## [1.0.0] - 2022-05-17
### Added
- first version
