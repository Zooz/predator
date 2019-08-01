!!! note "What you should already know"
   
    We assume you have already familiarized yourself with the basic concepts used in Predator and that you successfully created your first test. If not, we strongly recommend you first complete the steps in the [My First Test](myfirsttest.md) topic before proceeding with the instructions below.


## Data Reuse with Variables

The **Captures** field of the [HTTP request properties](myfirsttest.md#http-request-properties) allows you to extract (capture) data from the request response and store it in a variable for reuse in another request. Use JSONPath syntax to extract the data of your choice. In the following example we extract the `id` field and store it in a `petId` variable:

![Screenshot](images/extract_data_to_variable.png)

You can then use `petId` in a request by placing it between double brackets, like so:

`{{petId}}`

Here's an example of using `{{petId}}` in the request path:

![Screenshot](images/variable_in_path.png)


### Pick a random element from an array

When capturing responses data, you may want to randomly select an item from your dataset to continue with your scenario.  
This is achieved by using the `*` operator, which selects all the matching items. The engine will then randomly pick a single item for you and store it in the defined variable.  

Usage example :

![Screenshot](images/random_pick.png)
on
```json
[
	{
		"id": "45697038-37ae-4149-9f5e-ed7a4a20e014",
		"data": "132456789"
	}, {
		"id": "f02392e8-1b11-401f-a902-8a9a1ae5c47a",
		"data": "abcdefghi"
	}
]
```
will randomly store `45697038-...-ed7a4a20e014` or `f02392e8-...-8a9a1ae5c47a` in `{{dataId}}` for further usage in the scenario.


## Built-in Functions

Predator supports some generic functions out of the box and they can be used to generate random data

* `randomNumber(min, max)` will generate random number within the provided range.
* `$randomString(length)` will generate random string with the specified length.
* `$uuid()` will generate v4 UUID.
* `dateNow()` will generate Number of ms since epoch.

Usage example:

```json
{
	"id": "{{ $uuid() }}",
	"name": "{{ $randomString(6) }}",
	"age": "{{ $randomNumber(0,15) }}",
	"created": "{{$dateNow()}}",
}

```


## Request Reuse with DSL Definitions

This is the moment where Predator shows its teeth and unleashes its true power. 

Writing a performance test that checks specific parts of your API end-to-end can be a huge hassle, but now it is effortless. By creating DSL definitions using Predator's Domain Specific Language (DSL), request templates are generated which you can then reuse in the same test and in other tests under the same DSL type, reducing replication.

Let's dive right in and get going with our first DSL definition. 

!!! note "Predator API"
   
    This functionality is only available through the <a href="https://zooz.github.io/predator/indexapiref.html#section/Overview#section" target="_blank">Predator API</a>.

### Creating a DSL Definition

Before you can use a DSL definition, you must create it first. You do so by invoking the <a href="https://zooz.github.io/predator/indexapiref.html#operation/create-a-dsl-definition" target="_blank">Create DSL Definition</a> request. Here's an example request body for creating a DSL definition of a GET request. Notice how we use the `{{petId}}` in the url endpoint (we will create this variable in the example of a POST request DSL definition):

```JSON
{
	"name": "get-pet",
	"request": {
		"get": {
			"url": "http://127.0.0.1:3000/pets/{{petId}}"
		}	
	}
}
```

The request body for creating a DSL definition of a POST request is a bit more elaborate, since it requires that you pass in the entire body that makes up the POST request. The following example shows how to do this. Notice how we add a `capture` array, in which we define the `petId` variable for storing the pet ID. We can then reuse it in another request (like in the example of a GET request above).

```JSON
{
	"name": "create-pet",
	"request": {
		"post": {
			"url": "http://127.0.0.1:3000/pets",
			"json": {
				"name": "mickey",
				"species": "dog"
			},
			"capture": [
				{
					"json": "$.id",
					"as": "petId"
				}	
			]
		}	
	}
}
```


### Creating a Test that Uses the DSL

Tests that use a DSL definition can only be created using the <a href="https://zooz.github.io/predator/indexapiref.html#operation/create-a-test" target="_blank">Create Test</a> API request. The <a href="https://zooz.github.io/predator/indexapiref.html#operation/create-a-test" target="_blank">Create Test</a> API request body must include all components that make up a test, including pre-scenario requests and scenarios. However, instead of defining the entire HTTP request in each scenario step (as you would through the Predator UI), you can now reference the HTTP request through its DSL definition. You do so, using the `action` property (in the `steps` array). 

Here's an example:


```JSON
{
  "name": "Pet store",
  "description": "DSL",
  "type": "dsl", // Make sure the type is set to DSL
  "before": {
  	"steps": [
  		{
  			"action": "petstore.create-pet"
  		}	
  	]
  },
  "scenarios": [
  	{
  		"scenario_name": "Only get pet",
  		"steps": [
  			{
  				"action": "petstore.get-pet"
  			}	
  		]
  	}
  ]
}
```

There are two additional items to note:

* The `type` must always be set to `dsl`.

* The `action` value uses the following syntax: `{dsl_group}.{dsl_name}`, in which the `dsl_group` is the name used in the path of the <a href="https://zooz.github.io/predator/indexapiref.html#operation/create-a-dsl-definition" target="_blank">Create DSL Definition</a> API request. 

If you login to the Predator UI after creating the test, you will notice that the test has been added with a type of **dsl**. 

You can now run the test as you would any other. 

![Screenshot](images/dsltestinui.png)

## Creating a Test with Custom Logic in Javascript

Tests can use custom Javascript functions. To use custom Javascript functions in your tests, first create a text file holding your Javascript code 
and upload it to a public repository (such as S3, Dropbox, Google Docs etc.). Then create the test, passing the `processor_file_url` field in the request body to inform Predator of the URL path to your Javascript file. Predator will download and save this file (any changes done to your Javascript code after creating the test will not be reflected).

!!! note "Artillery guidelines"
   
    To include Javascript functions in your scenarios, make sure to follow the [Artillery guidelines](https://artillery.io/docs/http-reference/#loading-custom-js-code).


Here's an example of a test using custom Javascript code:

```JSON
{
  "name": "custom logic in Javascript example",
  "description": "custom logic in Javascript",
  "processor_file_url": "https://www.dropbox.com/s/yourFilePath/fileName.txt?dl=1",
  "type": "basic",
  "scenarios": [
    {
      "name": "Processor exmaple",
      "flow": [
        {
          "function": "generateRandomDataGlobal"
        },
        {
          "get": {
            "url": "http://www.google.com/{{ randomPath }}",
            "afterResponse": "logResponse"
          }
        },
        {
          "log": "********************* Sent a request to /users with {{ name }}, {{ email }}, {{ password }}"
        }
      ]
    }
  ]
}
```

Here's some sample Javascript code:

```javascript
'use strict';
const uuid = require('uuid/v4');
module.exports = {
  logResponse,
  generateRandomDataGlobal
};


  function logResponse(requestParams, response, context, ee, next) {
  if(response.statusCode !== 200){
       console.log('**************** fail with status code: ' + JSON.stringify(response.statusCode));
       console.log('**************** host is: ' + JSON.stringify(response.request.uri.host));
       console.log('**************** path is: ' + JSON.stringify(response.request.uri.pathname));
       console.log('**************** response headers is: ' + JSON.stringify(response.headers));

    }
     return next(); // MUST be called for the scenario to continue
  }


function generateRandomDataGlobal(userContext, events, done) {
console.log('userContext is: ' + JSON.stringify(userContext));
  userContext.vars.randomPath = 'random_path_' + uuid();
  userContext.vars.name = 'name_random_' + uuid();
  userContext.vars.email = 'email_random_' + uuid();
  userContext.vars.password = 'password_random_' + uuid();
  return done();
}
```

In the example above, we created a test with 2 Javascript functions:

* `logResponse()` will log the result received, if the `statusCode` is different from 200. The function will be called after each response using the `afterResponse` command.

* `generateRandomDataGlobal()` is a global function that creates global variables. Those variables can be used in the scope of the test by using the `{{ }}` syntax.

## Debugging Requests/Responses

For viewing all the requests and responses (Very useful when your test not behaves like you expected)
It's possible to run tests with the Debug flag (can be send via jobs api or toggled in the run test form)
The predator-runner will log this data to the log files which can be downloaded and investigated.
