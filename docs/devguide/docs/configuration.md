# Configuration

When running Predator, it is possible to retrieve and update some of the service's configuration 
during runtime with the /config endpoint, please check the API reference for more details.

Below are variables Predator can be configured with. 

## General
| Environment Variable        | Configuration key      	| Description                                                                             	| Configurable from UI/API 	| Default value               	|
|-----------------------------|-----------------------	|-----------------------------------------------------------------------------------------	|--------------------------	|-----------------------------	|
| INTERNAL_ADDRESS            | internal_address       	| The local ip address of your machine                                                    	| ✓                        	|                             	|
| RUNNER_DOCKER_IMAGE         | runner_docker_image    	| The predator-runner docker image that will run the test                                 	| ✓                        	| zooz/predator-runner:latest 	|
| RUNNER_CPU                  | runner_cpu          	| Number of CPU use by the each runner                                                    	| ✓                        	| 1                           	|
| RUNNER_MEMORY               | runner_memory       	| Max memory to use by each runner                                                        	| ✓                        	| 2048                      	|
| DEFAULT_EMAIL_ADDRESS       | default_email_address   | Default email to send final report to, address can be configured                        	| ✓                        	|                             	|
| DEFAULT_WEBHOOK_URL         | default_webhook_url    	| Default webhook url to send live report statistics to                                   	| ✓                        	|                             	|

## Database
| Environment Variable 	| Description                                                                     	| Configurable from UI/API 	| Default value 	|
|----------------------	|---------------------------------------------------------------------------------	|--------------------------	|---------------	|
| DATABASE_TYPE        	| Database to integrate Predator with [Cassandra, Postgres, MySQL, MSSQL, SQLITE] 	| x                        	| SQLITE        	|
| DATABASE_NAME        	| Database/Keyspace name                                                          	| x                        	|               	|
| DATABASE_ADDRESS     	| Database address                                                                	| x                        	|               	|
| DATABASE_USERNAME    	| Database username                                                               	| x                        	|               	|
| DATABASE_PASSWORD    	| Database password                                                               	| x                        	|               	|

Additional parameters for the following chosen databases:

#### Cassandra
| Environment Variable         	| Configurable from UI/API 	| Default value  	|
|------------------------------	|--------------------------	|----------------	|
| CASSANDRA_REPLICATION_FACTOR 	| x                        	| 1              	|
| CASSANDRA_CONSISTENCY        	| x                        	| localQuorum    	|
| CASSANDRA_KEY_SPACE_STRATEGY 	| x                        	| SimpleStrategy 	|
| CASSANDRA_LOCAL_DATA_CENTER  	| x                        	|                	|

#### SQLITE
| Environment Variable 	| Description      	| Configurable from UI/API 	| Default value 	|
|----------------------	|------------------	|--------------------------	|---------------	|
| SQLITE_STORATE       	| SQLITE file name 	| x                        	| predator      	|

## Deployment
| Environment Variable 	| Description                                                          	| Configurable from UI/API 	| Default value 	|
|----------------------	|----------------------------------------------------------------------	|--------------------------	|---------------	|
| JOB_PLATFORM         	| Type of platform using to run predator (METRONOME,KUBERNETES,DOCKER) 	| x                        	| DOCKER        	|

#### Kubernetes
| Environment Variable 	| Description          	| Configurable from UI/API 	| Default value 	|
|----------------------	|----------------------	|--------------------------	|---------------	|
| KUBERNETES_URL       	| Kubernetes API Url   	| x                        	|               	|
| KUBERNETES_TOKEN     	| Kubernetes API Token 	| x                        	|               	|
| KUBERNETES_NAMESPACE 	| Kubernetes Namespace 	| x                        	|               	|

#### Metronome
| Environment Variable 	| Description         	| Configurable from UI/API 	| Default value 	|
|----------------------	|---------------------	|--------------------------	|---------------	|
| METRONOME_URL        	| Metronome API Url   	| x                        	|               	|
| METRONOME_TOKEN      	| Metronome API Token 	| x                        	|               	|

#### Docker
| Environment Variable 	| Description                                               	| Configurable from UI/API 	| Default value 	|
|----------------------	|-----------------------------------------------------------	|--------------------------	|---------------	|
| DOCKER_HOST          	| Docker engine url (host and port number of docker engine) 	| x                        	|               	|
| DOCKER_CERT_PATH     	| Path to CA certificate directory                          	| x                        	|               	|

## Metrics
| PROCESS.ENV Variable 	| Configuration key   	| Description                                    	| Configurable from UI/API 	| Default value 	|
|----------------------	|---------------------	|------------------------------------------------	|--------------------------	|---------------	|
| METRICS_PLUGIN_NAME  	| metrics_plugin_name 	| Metrics integration to use [prometheus,influx] 	| ✓                        	|               	|

#### Prometheus
| Environment Variable 	| Configuration key                   	| Description                          	| Configurable from UI/API 	| Default value 	|
|----------------------	|-------------------------------------	|--------------------------------------	|--------------------------	|---------------	|
|                      	| prometheus_metrics.push_gateway_url 	| Url of push gateway                  	| ✓                        	|               	|
|                      	| prometheus_metrics.buckets_sizes    	| Bucket sizes to configure prometheus 	| ✓                        	|               	|

#### Influx
| Environment Variable 	| Configuration key       	| Description        	| Configurable from UI/API 	| Default value 	|
|----------------------	|-------------------------	|--------------------	|--------------------------	|---------------	|
|                      	| influx_metrics.host     	| Influx db host     	| ✓                        	|               	|
|                      	| influx_metrics.username 	| Influx db username 	| ✓                        	|               	|
|                      	| influx_metrics.password 	| Influx db password 	| ✓                        	|               	|
|                      	| influx_metrics.database 	| Influx db name     	| ✓                        	|               	|

## SMTP Server
| Environment Variable 	| Configuration key    	| Description                                               	| Configurable from UI/API 	| Default value 	|
|----------------------	|----------------------	|-----------------------------------------------------------	|--------------------------	|---------------	|
| SMTP_FROM            	| smtp_server.from     	| the 'from' email address that will be used to send emails 	| ✓                        	|               	|
| SMTP_HOST            	| smtp_server.host     	| SMTP host                                                 	| ✓                        	|               	|
| SMTP_PORT            	| smtp_server.port     	| SMTP port number                                          	| ✓                        	|               	|
| SMTP_USERNAME        	| smtp_server.username 	| SMTP username                                             	| ✓                        	|               	|
| SMTP_PASSWORD        	| smtp_server.password 	| SMTP password                                             	| ✓                        	|               	|
| SMTP_TIMEOUT         	| smtp_server.timeout  	| timeout to SMTP server in milliseconds                    	| ✓                        	|               	|
