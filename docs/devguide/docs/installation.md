# Installing Predator

Before Predator, running two or more tests simultaneously was limited due to third party limitations. Now, you are able to scale tests using our own resources. With support for both Kubernetes and Metronome, all you need to do is provide the platform configuration, sit back, and let Predator deploy runners that load your API from your chosen platform. 

You're probably eager to get your hands dirty, so let's go ahead and install Predator.

## Kubernetes

Install Predator from the [Helm Hub](https://hub.helm.sh/charts/zooz/predator)  

## DC/OS

Predator can be installed through DC/OS Universe within the cluster.
<br>
For examples and more info check [Universe Catalog](https://universe.dcos.io/#/package/predator/version/latest)

## Docker

Predator runs using Docker. In order to run Predator locally, clone the [repository](https://github.com/Zooz/predator) and run the following command:

`runPredatorLocal.sh`

Or, you can run Predator without cloning the repository with the following command :

```docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator```

where `$MACHINE_IP` is the local ip address of your machine.

After successfully mounting the Predator docker image, access Predator by typing the following URL in your browser:

```http://{$MACHINE_IP}/ui```