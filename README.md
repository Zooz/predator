# Predator
## Next generation open source performance testing platform for APIs.
[![Known Vulnerabilities](https://snyk.io/test/github/zooz/predator/badge.svg)](https://snyk.io/test/github/zooz/predator) [![Join the chat at https://gitter.im/predator-pf/community](https://badges.gitter.im/predator-pf/community.svg)](https://gitter.im/predator-pf/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/2786/badge)](https://bestpractices.coreinfrastructure.org/projects/2786)
![](https://zooz.github.io/predator/images/predator-screens.gif)



<p align="center">
  <img align="right" width="25%" height="25%" src="https://zooz.github.io/predator/images/mickeythepredator-logo.png">
</p>

Predator manages the entire lifecycle of stress-testing servers, from creating performance tests, to running these tests on a scheduled and on-demand basis, and finally viewing the test results in a highly informative and live report.

It has a simple, one-click installation, built with support for Kubernetes, DC/OS and Docker Engine, and can persist the created performance tests and their reports in 5 different databases. It also supports running distributed load out of the box. Bootstrapped with a user-friendly UI alongside a simple REST API, Predator helps developers simplify the performance testing regime.

## Documentation

[Starting Guide](http://predator-ng.com)
<br>
[API Reference](http://predator-ng.com/#indexapiref.html)

## Features
- **Distributed load**:  Predator supports unlimited number of load generators that produce load concurrently.
- **Real time reports**: Predator aggregate all concurrent runs into one beautiful report in real time (latency, rps, status codes and more)
- **Built for the cloud**:  Predator is built to take advantage of Kubernetes and DC/OS. it's integrated with those platform and is able to manage the load generators life cycles by it self.
- **One click installation**:  Installed via one click in Kubernetes, DC/OS, or any other machine that has Docker.
- **Supports 5 Different databases**: Predator can adjust it self to persist data in Cassandra, Postgres, MySQL, MSSQL and SQLITE out of the box.
- **Scheduled jobs**: Run any tests in recurring mode by cron expression.
- **3rd partry metrics**:  Predator integrated with Prometheus and Influx, just configure it via the config endpoint or the ui.
- **Rich UI**: Predator offers rich UI side by side powerful REST API.
- **Based on [artilliery.io](https://github.com/artilleryio/artillery)**: Predator uses artillery as its load engine to fire the requests. The schema of creating tests via api is based on artillery schema.


## System Overview

![](https://zooz.github.io/predator/images/predator-overview.png)

## Getting Started

### Kubernetes
Predator is designed to seamlessly deploy into your Kubernetes cluster. Install Predator from the [Helm Hub](https://hub.helm.sh/charts/zooz/predator)

### DC/OS
Predator is included in Mesosphere Universe. Please refer to https://github.com/dcos/examples/tree/master/predator for a quick start guide and examples for installing the package.

### Docker
`docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator`

where $MACHINE_IP=local ip address of your machine

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

## Contributing

Please read [CONTRIBUTING.md](https://github.com/Zooz/predator/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For a complete list of Docker images of this project please visit our [docker hub repository](https://hub.docker.com/r/zooz/predator/tags).

## Built With

* [Artillery](https://github.com/artilleryio/artillery) - Load test engine
* [React](https://github.com/facebook/react) - Web framework

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.md](LICENSE.md) file for details
