# akka-monitoring-tool

This project aims to provide a simple way to visualize Akka.NET cluster
and allow cluster admin to control cluster "leave/down" of each nodes.

In fact, although there are more powerful tools to do the job, such as Petabridge.cmd, I still want to try this idea
as an alternative approach to combine the web technology and make it a little bit visually attractive.

## Design in a nutshell

The fundamental idea of this project is to allow a web application (Angular app) connect to an Akka.NET cluster
via seed nodes. These seed nodes will have a self-host OWIN with websocket for streamming events and actions
to and from the web front-end.

Why I let web app connect to seed node via websocket?

* Firstly, websocket allows more flexible connection establishment from single web page.
Indeed, with websocket, as compared to SignalR, we can disconnect from one endpoint and connect to another one easily.
* Secondly, exposing websocket from seed nodes ensure a more accurate and up-to-date cluster state for the web front-end.
* Lastly, if all seed nodes can offer the cluster state separately, listening to all of them can provide us a better
view on possible split brain or any network partition scenarios.

One important point to mention is that I have compacted all of the logic required for OWIN websocket into a single C# library,
so-called `MonitorLib`. This single library allows a seamless integration to any seed nodes as below. 
This is very much like a standard startup for OWIN.

```csharp
string hostUrl = $"http://*:{10000 + clusterPort}/";
monitorApp = MonitorLib.ClusterMonitoring.Start(hostUrl, ClusterSystem);
Console.WriteLine($"Web app is running at {hostUrl}");
```

The library internally offers
* Message contracts (serializeable in JSON with Newtonsoft) to communicate between web app and backend
* Real-time push for cluster state whenever change happens
* Allow cluster actions: Leave and Down any members inside a cluster

## How to run

This project is organized into 2 sub directories:
* `web` for the Angular app
* `cluster` for an example of a cluster with 2 types of members: seed node and odinary member

To run angular app
```bat
yarn
ng serve
```

To run cluster seed node, I introduce an environment variable `CLUSTER_PORT` to allow port override.
Hence, let's use this to run seed node in 2 different ports
```bat
# in first console
set CLUSTER_PORT=8081
SeedNode.exe


# in second console
set CLUSTER_PORT=8082
SeedNode.exe
```

Then go to `localhost:4200` to view the web app.

The web app has `LocalStorage` integrated to allow users to save down cluster alias and seed nodes in a format
`clusterName@host:port,clusterName@host:port`. And users can add as many cluster configs or seed nodes as they want.

Happy hacking!
