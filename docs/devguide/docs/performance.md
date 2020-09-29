# Predator Runner Performance  
  
While Predator is designed to support an unlimited load, it's important to understand how this can be achieved.  
Predator is the mothership and it's responsible to spin up multiple load generators, aka multiple Predator-Runners. 
The ability to spin up an endless amount of Predator-Runners (as long as you have the required resources) allows Predator to create unlimited distributed load.

### Predator-Runner

<u>[Predator-Runner](https://github.com/Zooz/predator-runner)</u> is a Node.js project which runs a custom version of [artillery](https://github.com/artilleryio/artillery)
 at its core.  
While Node.js is a good fit for the use-case of Predator-Runner as its main responsibility is to fire HTTP requests (Non-blocking I/O), it's also limited to 1 core usage (when cluster/child modules are not involved, in which case here they are not).  
It's also important to note that when a Node.js process reaches near 100% CPU it's starting to report inaccurate results about latency because the event loop is extremely slow.  
  
### The Three Variables

Predator allows users to choose the arrival rate and not the concurrent users, meaning that users of Predator can aim to exact RPS they want to test.  
With that being said, each predator-runner's throughput depends on 3 params: **arrival rate**, **max virtual users** and the **latency** of the fired request.  
  
* **Max virtual users** means that if there are more than (X) concurrent requests, new requests will be dropped in order to not overkill the CPU (can be seen as **avoidedScenarios** statistic in the metrics and reports).   
We suggest set  'Max virtual users' to 250.  
  
* **Arrival rate** in its best, each Predator-Runner can do 1200 RPS.  
But this is correlated to the latency of the requests and  'Max virtual users' param.  
For example:  
1. The average latency is 200ms, this means each virtual users can do 5 RPS, so 250 virtual users can do 1250 RPS.  
2. The average latency is 500ms, this means each virtual user can do 2 RPS, so 250 virtual users can do 500 RPS.   

### Conclusions
 
To summarize the above, if average request latency is below 200ms, 'Predator-runner' will be able to hit 1200 RPS. If it's latency is higher, it will do less.
 
!!! note "Not all CPU's are equal"  
    Not all CPU's are equal, the recommendation in this page written after thorough testing with an AWS EC2 m4.2xlarge machine.
