# Plugins

Metrics and test reports are an essential part of Predator. 
For this, Predator can be integrated to send test metrics to either Prometheus or Influx, 
and to send final test results straight to your email upon test completion.

## SMTP Server - Email Notifier

Set up a connection to your SMTP server to receive email notifactions. Please refer to <u>[configuration section](configuration.md#smtp-server)</u> to see required variables.

## Prometheus

Set up a connection to your Prometheus Push-Gateway to receive test run metrics. Please refer to <u>[configuration section](configuration.md#prometheus)</u> to see required variables.

For reference, Predator uses the following <u>[plugin](https://github.com/enudler/artillery-plugin-prometheus)</u> to export Prometheus metrics.

Default bucket sizes of  `[0.01, 0.05, 0.010, 0.50, 0.100, 0.200, 0.300, 0.400, 0.500, 1, 2, 5, 10, 30, 60, 120]` are configured but can be changed through Predator's Prometheus metrics configuration.

Some of the metrics pushed by Predator-Runner to the Prometheus are:

1. `request_with_phases_duration_seconds`: Histogram that represents the duration of phases in the request in seconds, and consists of the following label names: `['path', 'status_code', 'phase', 'request_name']`
    - `path`: path of the request
    - `status_code`: response status code
    - `phase`: phase of the request, can be one of the following
        - `wait`: duration of socket initialization
        - `dns`: duration of DNS lookup
        - `tcp`: duration of TCP connection
        - `response`: duration of HTTP server response
        - `total`: duration entire HTTP round-trip
    - `request_name`: name of the request (if not defined then the name = method + path)


## InfluxDB

Set up a connection to your InfluxDB to receive test run metrics. Please refer to <u>[configuration section](configuration.md#influxdb)</u> to see required variables.

For reference, Predator uses the following <u>[plugin](https://github.com/Nordstrom/artillery-plugin-influxdb)</u> to export InfluxDB metrics.