# Guidelines

First off, thanks for taking the time to contribute! 

The following is a set of guidelines for contributing to Predator and its packages, which are hosted in the [Predator](https://github.com/Zooz/predator) project on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Where to start?
If you would like to submit a bug report, feature request, or PR we have some guidelines outlined here. For any questions feel free to contact us on our [Slack workspace](https://join.slack.com/t/predator-dev/shared_invite/enQtNjgwMzE2NjM3MDcyLTg5YTIwMGQyNjZlMjQ4MDNjOTk5YTkwMWYwNzJkOWFmM2QwOGY0ODc3MDU3MWRkYTAwMjRhMjBhOTM1MzFmMjU).

## Submitting a Bug Report
Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). Provide the following information when submitting a bug:

* Use a clear and descriptive title for the issue to identify the problem.
* Describe the exact steps which reproduce the problem in as many details as possible. 
* Provide specific examples to demonstrate the steps. Include links to files or GitHub projects, or copy pasteable snippets, which you use in those examples. If you're providing snippets in the issue, use Markdown code blocks.
* Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
* Explain which behavior you expected to see instead and why.

## Contributing Code Changes

As an open-source project, we welcome and encourage the community to submit patches directly to the project. In our collaborative open source environment, standards for submitting changes help reduce the chaos that can result from an active development community. So here are some high-level steps we suggest you follow when contributing code changes:

1. Fork the project & clone locally.
2. Create an upstream remote and sync your local copy before you branch.
3. Branch for each separate piece of work.
4. Do the work, write good commit messages.
   - Commit messages must adhere to [commitlint](https://github.com/conventional-changelog/commitlint) standards.
5. For new functionality, add tests (unit, integration, system) that test the feature.
6. Run tests and make sure they all pass: `npm run test`
7. Push to your origin repository.
8. Create a new PR in GitHub.
9. Respond to any code review feedback.

## Contributing Documentation Changes

Documentation is mega-important. Predator cannot truly succeed without great documentation. It’s that simple. So please make sure to provide documentation updates for any new features you contributed, including useful example code snippets.

Needless to say, as a user of this project you're perfect for helping us improve our docs. Feel free to report documentation bugs or submit documentation changes through a pull request.

# Project Architecture
Predator is distributed between 3 projects:
1. [Predator](https://github.com/Zooz/predator)
2. [Predator-Runner](https://github.com/Zooz/predator-runner): Predator-Runner load generator that creates the load on the http endpoints
3. [Predator Helm-Chart](https://github.com/Zooz/helm/tree/master/predator): Helm-chart project for installing Predator in Kubernetes clusters


## Predator File Structure

```
src/
├── app.js
├── server.js 
├── common              # common utils used throughout the project
├── config              # application configuration
├── configManager       # config API model
├── database            # database setup and configurations
├── files               # files API model
├── jobs                # jobs API model
├── processors          # processors API model
├── reports             # reports API model
├── tests               # tests API model
└── webhooks            # webhooks API model

tests/
├── configurations
├── docs
├── integration-tests
│   ├── configManager
│   ├── files
│   ├── jobs
│   ├── processors
│   ├── reports
│   ├── run.sh
│   ├── runLocal.sh
│   ├── tests
│   └── webhooks
├── testExamples                # artillery test files used for testing
├── testResults                 # responses used for testing
└── unit-tests
    ├── configManager
    ├── env-test.js
    ├── files
    ├── jobs
    ├── processors
    ├── reporter
    ├── tests
    └── webhooks

ui/
└── src
    ├── App                     # main page of Predator
    ├── features                
        ├── components          # components used in the project
        └── redux               # redux API
    ├── images                  # images to be used can be saved here
    └── store                   # redux store
```

## System Resource Folder Structure
The following is an in-depth structure of the resources that Predator manages. They all have the same folders and file structure.
```
.
└── src/
    └── resourceName/
        ├── routes/ # Contains the express router and routing.
        │   └── resourceNameRouter.js 
        ├── controllers/ # Contains all the middlewares
        │   └── resourceNameController.js 
        └── models/
            └── resourceNameManager.js # Handles the Business Logic of the resource
                └── databaseConnector # DAL interface
                    └── sequelize/
                        └── sequelizeConnector.js # implementation of DAL over sequelize      
``` 
Adding a new system resource? get quickly started by following the folder structure.
Once setup it will be easier to solve the puzzle :)
