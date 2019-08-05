# Frequently Asked Questions

## Installation

### <b>Predator is running, how do I access the UI?</b>

The UI is accessible at http://$MACHINE_IP/ui where `$MACHINE_IP` is your local network address you used to install Predator.
                        
## Tests

### <b>I run a test successfully but no report is created for the test</b>

The Predator-Runner docker that is reporting the test results back to Predator isn't able to connect to it, 
which is why the test runs but no report is generated. When installing Predator in Docker, the following command is used:
```
docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 \
-p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator
```

The `INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1` is what the Predator-Runner uses to communicate with Predator, 
and `$MACHINE_IP` needs to be your local network address (an IP address). You can get it by running the command: 
```
ifconfig en0 | grep 'inet ' | cut -d' ' -f2
```

For more information regarding correct installation of Predator using Docker visit the [Installation](installation.md#docker) section.

It is important to note this is an issue and solution only in Docker installations. 
In Kubernetes and DC/OS installations the `INTERNAL_ADDRESS` is built in.

### <b>What is the http engine Predator uses to run the load?</b>

Predator uses [Artillery](https://github.com/artilleryio/artillery) as its HTTP load engine. 
Therefore, all `basic` type tests are written in Artillery syntax and all of the features Artillery supports, Predator supports.

To read more about Artillery and its features visit their well written documentary: 
<br>
- [Artillery Documentation](https://artillery.io/docs/)
<br>
- [Artillery Basic Concepts Documentation](https://artillery.io/docs/basic-concepts/)
<br>
- [Artillery Test Structure Documentation](https://artillery.io/docs/script-reference/)
<br>
- [Artillery HTTP Engine Documentation](https://artillery.io/docs/http-reference/)
<br>

### <b>I want to use Predator's API, where can I find examples for creating advanced/dsl tests?</b>

Here is a [postman collection](https://documenter.getpostman.com/view/220627/S1TYTvP2?version=latest) which contains examples
for creating tests with custom javascript and dsl definitions.

### <b>What content types Predator supports?</b>

While Predator UI currently supports creating tests with JSON body, the actual API has no such limit.
Instead of specifying 'json' key you can specify 'body' key.<br>
For example:<br>

```JSON
  {
  	"post": {
  		"url": "/orders",
  		"headers": {
  			"Content-Type": "text/html"
  		},
  		"body": "Not Json :)"
  	  }
  }
```

## Configuration

### <b>I ran Predator with SQLITE and would like to migrate now to a different database. How do I do this?</b>

Migration between different databases is not possible. 
In order to run Predator with a different supported database, 
you must restart Predator with the new [configuration](configuration.md#database).

## Metrics

### <b>Is Predator supports exporting metrics to external time series databases?</b>

Yes, Predator supports [Prometheus](https://prometheus.io) and [Influx](https://www.influxdata.com/), and can export metrics by endpoint and status code, something that currently is not available in the Predator UI.

### <b>How can I export metrics to Prometheus?</b>

[Prometheus](https://prometheus.io) by its nature is a scraper, while the Predator-runner is a job without a specific API and finite time life.
To overcome this:
<br>
1. Deploy [Prometheus push gateway](https://github.com/prometheus/pushgateway) 
<br>
2. [Configure](configuration.md#prometheus) Predator to push metrics to the push gateway.
<br>
3. Configure Prometheus to scrape from the push gateway.

### <b>Is there any dashboard for Grafana I can use?</b>

[this](https://github.com/Zooz/predator/blob/master/resources/grafana_prometheus_dashboard.json) dashboard for example configured to read from Prometheus.

![Screenshot](images/grafana_dashboard.png)
