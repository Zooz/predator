# Configuration

When running Predator, it is possible to retrieve and update the service's configuration 
during runtime with the /config endpoint, please check the API reference for more details.

Below are variables Predator can be configured with. 

## General
- INTERNAL_ADDRESS:  
- DOCKER_NAME: 
- JOB_PLATFORM: 
- RUNNER_CPU: 
- RUNNER_MEMORY: 
- MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS: 
- DEFAULT_EMAIL_ADDRESS: 
- DEFAULT_WEBHOOK_URL: 

## Database
- DATABASE_TYPE: (default: SQLITE)
- DATABASE_NAME
- DATABASE_ADDRESS
- DATABASE_USERNAME
- DATABASE_PASSWORD

### Cassandra
- CASSANDRA_REPLICATION_FACTOR
- CASSANDRA_CONSISTENCY
- CASSANDRA_KEY_SPACE_STRATEGY
- CASSANDRA_LOCAL_DATA_CENTER

### SQLITE
- SQLITE_STORAGE

## Metrics
- METRICS_PLUGIN_NAME: 
- INFLUX_METRICS: 
- PROMETHEUS_METRICS: 

## SMTP Server
- process.env.SMTP_FROM:
- process.env.SMTP_HOST:
- process.env.SMTP_PORT:
- process.env.SMTP_USERNAME:
- process.env.SMTP_PASSWORD:
- process.env.SMTP_TIMEOUT:

