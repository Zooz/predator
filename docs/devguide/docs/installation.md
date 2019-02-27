# Installing Predator

Before Predator, running two or more tests simultaneously was limited due to third party limitations. Now, you are able to scale tests using our own resources. With support for both Kubernetes and Metronome, all you need to do is provide the platform configuration, sit back, and let Predator deploy runners that load your API from your chosen platform. 

You're probably eager to get your hands dirty, so let's go ahead and install Predator.

## Kubernetes

Bacon ipsum dolor amet cupim chicken pork ribeye. Short loin ball tip jowl beef. Ball tip strip steak jowl tail shoulder doner chicken salami beef ribs pork short ribs swine ham hock landjaeger biltong. Ribeye cow filet mignon landjaeger.

```
pork --save
```

## DC/OS

Jowl pancetta meatloaf short ribs buffalo. Leberkas meatball alcatra chuck, capicola buffalo spare ribs shankle sirloin tenderloin landjaeger salami meatloaf biltong. Flank pancetta meatball turkey chuck tenderloin bresaola biltong prosciutto andouille. Turducken jowl ball tip short loin.

## Docker

Predator runs using Docker. In order to run Predator locally run the following command:

`runPredatorLocal.sh`

You can also manually run the following command:

```docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator```

where `$MACHINE_IP` is the local ip address of your machine.

After successfully mounting the Predator docker image, access Predator by typing the following URL in your browser:

```http://{ipaddress}/predator```