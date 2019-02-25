# Predator

[![Join the chat at https://gitter.im/predator-pf/community](https://badges.gitter.im/predator-pf/community.svg)](https://gitter.im/predator-pf/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Predator is an open-source performance testing framework. Predator manages the entire lifecycle of stress-testing a server, 
from creating a test file, to running scheduled and on-demand tests, and finally viewing the test results in a highly informative report. 
Bootstrapped with a user-friendly UI alongside a simple REST API, Predator helps developers simplify the performance testing regime.

## Getting Started

These instructions will help you run Predator on your local machine.

### Installing using Docker

Predator runs using Docker. In order to run Predator locally run the following command:

`runPredatorLocal.sh`

<b>OR</b>
 
Manually run `docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator`

where $MACHINE_IP=local ip address of your machine

## Deployment

Two different deployment types exist when deploying Predator.

### Kubernetes
Link to readthedocs

### DC/OS
Link to readthedocs

## Running the tests

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