# Plugins

Metrics and test reports are an essential part of Predator. 
For this, Predator can be integrated to send test metrics to either Prometheus or Influx, 
and to send final test results straight to your email upon test completion.

## SMTP Server - Email Notifier

Set up a connection to your SMTP server to receive email notifactions. Please refer to <u>[configuration section](configuration.md#smtp-server)</u> to see required variables.

## Prometheus

Set up a connection to your Prometheus Push-Gateway to receive test run metrics. Please refer to <u>[configuration section](configuration.md#prometheus)</u> to see required variables.

For reference, Predator uses the following <u>[plugin](https://github.com/enudler/artillery-plugin-prometheus)</u> to export Prometheus metrics.


## InfluxDB

Set up a connection to your InfluxDB to receive test run metrics. Please refer to <u>[configuration section](configuration.md#influxdb)</u> to see required variables.

For reference, Predator uses the following <u>[plugin](https://github.com/Nordstrom/artillery-plugin-influxdb)</u> to export InfluxDB metrics.