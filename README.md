# Predator

[![Join the chat at https://gitter.im/predator-pf/community](https://badges.gitter.im/predator-pf/community.svg)](https://gitter.im/predator-pf/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Predator is an open-source distributed performance testing framework. Predator manages the entire lifecycle of stress-testing a server, 
from creating a test file, to running scheduled and on-demand tests, and finally viewing the test results in a highly informative report. 
Bootstrapped with a user-friendly UI alongside a simple REST API, Predator helps developers simplify the performance testing regime.

## Documentation

[Starting Guide](https://zooz.github.io/predator/)
<br>
[API Reference](https://zooz.github.io/predator/#indexapiref.html)

## Features
- **Distributed load**:  Predator supports unlimited number of load generators that produce load concurrently.
- **Real time reports**: Predator aggreated all concurrent runs into one beautiful report in real time (latency, rps, status codes and more)
- **Built for the cloud**:  Predator is built to take advantage of Kubernetes and DC/OS. it's integrated with those platform and is able to manage the load generators life cycles by it self.
- **One click installation**:  Installed via one click in Kubernetes, DC/OS, or any other machine that has Docker.
- **Supports 5 Diffrent databases**: Predator can ajust it self to persist data in Cassandra, Postgres, MySQL, MSSQL and SQLITE out of the box.
- **Scheduled jobs**: Run any tests in recurring mode by cron expression.
- **3rd partry metrics**:  Predator integrated with Promethues and Influx, just configure it via the config endpoint or the ui.
- **Rich UI**: Predator offers rich UI side by side powerful REST API.
- **Based on [artilliery.io](https://github.com/artilleryio/artillery)**: Predator uses artilliery as it's engine to fire the requests. the schema of creating tests via api is based on artilliery schema.


## Getting Started

### Kubernetes
Predator is designed to seamlessly deploy into your Kubernetes cluster. This is done with helm charts. For this, run the following command:

`helm repo add zooz https://zooz.github.io/helm/`
<br>
`helm install predator`

<br>follow the simple guidelines in the [README](https://zooz.github.io/helm/) to configure the appropriate variables.

### Docker
`docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator`

where $MACHINE_IP=local ip address of your machine

### DC/OS
Predator has a PR open waiting for approval to be included in the Mesosphere Universe.

### Developers
Predator runs using Docker. In order to source code locally, clone this repository and then run the following command:

`runPredatorLocal.sh`

#### Running the tests

Run `npm test` in order to run tests in your local machine. The script runs the following tests:
* lint
* unit-tests
* integration-tests

## Contributing

Please read [CONTRIBUTING.md](https://github.com/Zooz/predator/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For a complete list of Docker images of this project please visit our [docker hub repository](https://hub.docker.com/r/zooz/predator/tags).

## Built With

* [Artillery](https://github.com/artilleryio/artillery) - Load test engine
* [React](https://github.com/facebook/react) - Web framework

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.md](LICENSE.md) file for details

![](https://i.ibb.co/Gk7Dyxr/9c8b2df98bd1dc4cb8acc1472e74e00e-predatorlogo.png)
