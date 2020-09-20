# Configuration

When running Predator, it is possible to retrieve and update some of the service's configuration 
during runtime with the /config endpoint, please check the API reference for more details.

Below are variables Predator can be configured with. 

## General
| Environment Variable                            | Configuration key      	                    | Description                                                                             	                                                          | Configurable from UI/API  	| Default value               	|
|-------------------------------------------------|---------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------  |---------------------------- |-----------------------------	|
| INTERNAL_ADDRESS                                | internal_address       	                    | The local ip address of your machine                                                    	                                                          | ✓                        	|                             	|
| RUNNER_DOCKER_IMAGE                             | runner_docker_image    	                    | The predator-runner docker image that will run the test                                           	                                              | ✓                        	| zooz/predator-runner:latest 	|
| RUNNER_CPU                                      | runner_cpu          	                    | Number of CPU use by the each runner                                                              	                                              | ✓                        	| 1                           	|
| RUNNER_MEMORY                                   | runner_memory       	                    | Max memory to use by each runner                                                        	                                                          | ✓                        	| 256                      	    |
| DEFAULT_EMAIL_ADDRESS                           | default_email_address                       | Default email to send final report to, address can be configured                        	                                                          | ✓                        	|                             	|
| ALLOW_INSECURE_TLS                              | allow_insecure_tls    	                    | If true, don't fail requests on unverified server certificate errors                                                                                | ✓                        	| false                         |
| DELAY_RUNNER_MS                                 | delay_runner_ms    	                        | Delay the predator runner from sending http requests (ms)                                                                                           | ✓                        	|                               |
| INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS         | interval_cleanup_finished_containers_ms    	| Interval (in ms) to search and delete finished tests containers. Value of 0 means no auto clearing enabled                                          | ✓                        	| 0                             |
| CUSTOM_RUNNER_DEFINITION                        | custom_runner_definition                    | Custom json that will be merged with the kubernetes/metronome predator runner job definition. See FAQ for usage examples.                           | API                         |                               |

## Database
| Environment Variable 	| Description                                                                     	| Configurable from UI/API 	| Default value 	|
|----------------------	|---------------------------------------------------------------------------------	|--------------------------	|---------------	|
| DATABASE_TYPE        	| Database to integrate Predator with [Postgres, MySQL, MSSQL, SQLITE] 	| x                        	| SQLITE        	|
| DATABASE_NAME        	| Database/Keyspace name                                                          	| x                        	|               	|
| DATABASE_ADDRESS     	| Database address                                                                	| x                        	|               	|
| DATABASE_USERNAME    	| Database username                                                               	| x                        	|               	|
| DATABASE_PASSWORD    	| Database password                                                               	| x                        	|               	|

Additional parameters for the following chosen databases:

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


## Benchmarks
| Environment Variable 	| Configuration key    	| Description                                               	| Configurable from UI/API 	| Default value 	|
|----------------------	|----------------------	|-----------------------------------------------------------	|--------------------------	|---------------	|
| BENCHMARK_THRESHOLD            	| benchmark_threshold     	| Minimum acceptable score of tests, if a score is less than this value, a webhook will be sent to the threshold webhook url 	| ✓                        	|               	|
|         	| benchmark_weights.percentile_ninety_five.percentage     	| Percentage of the score affected by p95 results                	| ✓                        	| 20              	|
|         	| benchmark_weights.percentile_fifty.percentage 	| Percentage of the score affected by median results                       	| ✓                        	| 20              	|
|         	| benchmark_weights.server_errors_ratio.percentage 	| Percentage of the score affected by server errors ratio                  	| ✓                        	| 20              	|
|          	| benchmark_weights.client_errors_ratio.percentage  	| Percentage of the score affected by client errors ratio              	| ✓                        	| 20              	|
|          	| benchmark_weights.rps.percentage  	|  Percentage of the score affected by requests per second results                   	| ✓                        	| 20           	    |

## Metrics
| PROCESS.ENV Variable 	| Configuration key   	| Description                                    	| Configurable from UI/API 	| Default value 	|
|----------------------	|---------------------	|------------------------------------------------	|--------------------------	|---------------	|
| METRICS_PLUGIN_NAME  	| metrics_plugin_name 	| Metrics integration to use [prometheus,influx] 	| ✓                        	|               	|

#### Prometheus
| Environment Variable 	| Configuration key                   	| Description                          	            | Configurable from UI/API 	| Default value 	|
|----------------------	|-------------------------------------	|---------------------------------------------------|--------------------------	|---------------	|
|                      	| prometheus_metrics.push_gateway_url 	| Url of push gateway                  	            | ✓                        	|               	|
|                      	| prometheus_metrics.buckets_sizes    	| Bucket sizes to configure prometheus 	            | ✓                        	|               	|
|                      	| prometheus_metrics.labels    	        | Labels will be passed to the push gateway       	| ✓                        	|               	|

#### InfluxDB
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
| SMTP_TIMEOUT         	| smtp_server.timeout  	| How many milliseconds to wait for the connection to establish to SMTP server                   	| ✓                        	| 200              	|
| SMTP_SECURE         	| smtp_server.secure  	|  if true the connection will use TLS when connecting to server. [Nodemailer SMTP options](https://nodemailer.com/smtp/)                   	| ✓                        	| false           	|
| SMTP_REJECT_UNAUTH_CERTS         	| smtp_server.rejectUnauthCerts  	| should fail or succeed on unauthorized certificate                 	| ✓                        	| false              	|
