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

Predator runs in a docker and it triggers other dockers which actually create the load (predator-runner).
In order to avoid dind side affects, Predator will start its runners as siblings.

So this means two things

1. When starting Predator in a docker we will mount the docker socket to the container. This will allow Predator start the siblings dockers (predator-runner) 
<br>
```-v /var/run/docker.sock:/var/run/docker.sock``` 
2. Predator runners will have to reach the main Predator to report test results. Predator has to know it's own accessible address and pass it to the predator-runners.
<br> 
 ```-e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1```
   where `$MACHINE_IP` is the local ip address of your machine (not localhost, but actual ip address).
   In unix or mac this command should give you the ip address:
   </br>
   ```export MACHINE_IP=$(ipconfig getifaddr en0 || ifconfig eth0|grep 'inet addr:'|cut -d':' -f2|awk '{ print $1}')```

```docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator```


After successfully starting the Predator docker image, access Predator by typing the following URL in your browser:

```http://{$MACHINE_IP}/ui```

!!! note "If you don't see test reports"
   
    This usually means that the predator-runner couldn't reach the main Predator and report about test progress;
    <br>
    ```docker logs $(docker ps -a -f name=predator -n 1 --format='{{ .ID }}')```
    <br>
    Will help to understand what went wrong.
