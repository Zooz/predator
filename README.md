# Predator
## Most powerful open-source platform for load testing APIs.
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/2786/badge)](https://bestpractices.coreinfrastructure.org/projects/2786)
[![Join Slack](https://img.shields.io/badge/slack-join-green.svg)](https://join.slack.com/t/predator-dev/shared_invite/enQtNjgwMzE2NjM3MDcyLTg5YTIwMGQyNjZlMjQ4MDNjOTk5YTkwMWYwNzJkOWFmM2QwOGY0ODc3MDU3MWRkYTAwMjRhMjBhOTM1MzFmMjU)

<h1 align="center">
<img src="https://zooz.github.io/predator/images/predator-1764x640.png" data-canonical-src="https://zooz.github.io/predator/images/predator-1764x640.png"/>
</h1>

## Features
|                                 |                    |          |
|-------------------------------- |:------------------:|:---------|
| Distributed Load                | :sparkle:          |Predator supports an unlimited number of load generators that produce multiple load runners concurrently.
| Rich UI                         | :sparkle:          |Predator offers a rich UI where you can write tests, run them and compare results.
| Reports && Tests Persistence    | :sparkle:          |Predator provides out-of-the box functionality for persisting data in Cassandra, Postgres, MySQL, MSSQL and SQLITE.
| Real time reports               | :sparkle:          |Predator aggregates all concurrent runs into a single beautiful report in real time (latency, rps, status codes and more).
| CSV Datasets                    | :sparkle:          |Predator support uploading files like csv to provide dataset for test inputs
| Scheduled runs                  | :sparkle:          |Predator can run recurring tests using cron expressions.
| REST API                        | :sparkle:          |Full REST API to integrate Predator with CI/CD frameworks 
| Slack notifications             | :sparkle:          |Predator support notification to slack upon important test events. 
| Benchmarks                      | :sparkle:          |Set benchmarks to compare test runs to ensure performance degradation is discovered early in development. Allows to measure every build and release against specified baseline results guaranteeing safer releases to production.|
| Cloud Native                    | :sparkle:          |Predator is built to take advantage of Kubernetes and DC/OS. It's integrated with those platforms and can manage the load generators lifecycles by itself.
| Prometheus/Influx integration   | :sparkle:          |Predator comes integrated with Prometheus and Influx. Simply configure it through the predator REST API or using the UI.
| Compare Multiple tests results  | :sparkle:          |Built-in dashboard to compare multiple test runs at once.
| Webhooks API                    | :soon:             |Coming soon in v1.5
| Functional Testing              | :soon:             |Coming soon in v1.5


![](https://zooz.github.io/predator/images/predator-screens.gif)

Predator manages the entire lifecycle of stress-testing servers, from creating performance tests, to running these tests on a scheduled and on-demand basis, and finally viewing the test results in a highly informative and live report.

It has a simple, one-click installation, built with support for Kubernetes, DC/OS and Docker Engine, and can persist the created performance tests and their reports in 5 different databases. It also supports running distributed load out of the box. Bootstrapped with a user-friendly UI alongside a simple REST API, Predator helps developers simplify the performance testing regime.

[**Installation**](https://www.predator.dev/#installation) &nbsp; |
&nbsp; [**Site**](https://predator.dev) &nbsp; |
&nbsp; [**Documentation**](https://zooz.github.io/predator/about.html) &nbsp; |
&nbsp; [**API Reference**](https://zooz.github.io/predator//indexapiref.html) | 
&nbsp; [**API Tests Examples**](https://documenter.getpostman.com/view/220627/S1TYTvP2?version=latest)

## System Overview

![](https://zooz.github.io/predator/images/predator-overview.png)

## Getting Started

### Kubernetes
Predator is designed to seamlessly deploy into your Kubernetes cluster. Install Predator from the [Helm Hub](https://hub.helm.sh/charts/zooz/predator)

### DC/OS
Predator is included in Mesosphere Universe. Please refer to https://universe.dcos.io/#/package/predator/version/latest for a quick start guide and examples for installing the package.

### Docker

Without persisted storage:

```docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator```

With persisted storage:

```docker run -d -e SQLITE_STORAGE=db/predator -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock -v /tmp/predator:/usr/db zooz/predator```

where $MACHINE_IP is the local ip address of your machine (not localhost, but actual ip address - it is your local network address).

### Developers
Predator runs using Docker. In order to run Predator locally, clone this repository and then run the following command:

`runPredatorLocal.sh`

or refer to the [Docker](#docker) instructions above.

##### Running the tests

Run `npm test` in order to run tests in your local machine. The script runs the following tests:
* lint
* unit-tests
* integration-tests

## Opening the Predator UI
The path for accessing the Predator UI is: http://localhost/ui (in the case that Predator is running locally under port 80)
<br>

In case Predator is not running under the root domain, (for example, running under http://your.domain.com/example-path) in order to access the UI follow the below steps:
1. `docker build --build-arg BUCKET_PATH=example-path . -t predator`
2. Deploy the tagged docker image to your preferred platform
3. Access the Predator UI at http://your.domain.com/example-path/ui

In case you host Predator's docs website on a different URL ( for example, Predator runs in a closed network without access to the internet ) you can configure the docs link in the UI using the PREDATOR_DOCS_URL build-arg.
if PREDATOR_DOCS_URL was not specified, the default value is `https://zooz.github.io/predator`.

1. `docker build --build-arg PREDATOR_DOCS_URL=http://your.predator.docs.com/example-path . -t predator`
2. Deploy the tagged docker image to your preferred platform
3. One should be redirected to `http://your.predator.docs.com/example-path` when clicking the on the docs link in the UI side menu.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/Zooz/predator/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For a complete list of Docker images of this project please visit our [docker hub repository](https://hub.docker.com/r/zooz/predator/tags).

## Built With

* [Artillery](https://github.com/artilleryio/artillery) - Load test engine
* [React](https://github.com/facebook/react) - Web framework

## Contact

For topics that are better discussed live, please join the
[Predator Slack](https://join.slack.com/t/predator-dev/shared_invite/enQtNjgwMzE2NjM3MDcyLTg5YTIwMGQyNjZlMjQ4MDNjOTk5YTkwMWYwNzJkOWFmM2QwOGY0ODc3MDU3MWRkYTAwMjRhMjBhOTM1MzFmMjU) workspace.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.md](LICENSE.md) file for details
