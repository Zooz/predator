# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.0.10"></a>
## [1.0.10](https://github.com/Zooz/predator/compare/v1.0.9...v1.0.10) (2019-05-12)


### Bug Fixes

* **ui:** remove stacking on reports ([#133](https://github.com/Zooz/predator/issues/133)) ([e30c3c8](https://github.com/Zooz/predator/commit/e30c3c8))



<a name="1.0.9"></a>
## [1.0.9](https://github.com/Zooz/predator/compare/v1.0.8...v1.0.9) (2019-04-18)


### Bug Fixes

* **jobs:** fixing delay_runner_ms to send as env variable string ([8c9d2a2](https://github.com/Zooz/predator/commit/8c9d2a2))
* **reports:** fixing end time of finished grafana reports ([15ed10f](https://github.com/Zooz/predator/commit/15ed10f))
* **reports:** fixing end time of finished grafana reports ([316683b](https://github.com/Zooz/predator/commit/316683b))
* **vulnerabilites:** upgrade sequelize to v5 + fix other vulnerabilities ([#128](https://github.com/Zooz/predator/issues/128)) ([41603b6](https://github.com/Zooz/predator/commit/41603b6))


### Features

* **general:** support for proxy url and debug for runners ([#124](https://github.com/Zooz/predator/issues/124)) ([5d554f1](https://github.com/Zooz/predator/commit/5d554f1))



<a name="1.0.8"></a>
## [1.0.8](https://github.com/Zooz/predator/compare/v1.0.7...v1.0.8) (2019-04-05)


### Bug Fixes

* **reports:** final report status to include aborted ([#113](https://github.com/Zooz/predator/issues/113)) ([5ce9659](https://github.com/Zooz/predator/commit/5ce9659))



<a name="1.0.7"></a>
## [1.0.7](https://github.com/Zooz/predator/compare/v1.0.6...v1.0.7) (2019-03-27)



<a name="1.0.6"></a>
## [1.0.6](https://github.com/Zooz/predator/compare/v1.0.5...v1.0.6) (2019-03-27)


### Bug Fixes

* **ui:** fix bug where every key closed the create test ([29a2dcb](https://github.com/Zooz/predator/commit/29a2dcb))



<a name="1.0.5"></a>
## [1.0.5](https://github.com/Zooz/predator/compare/v1.0.4...v1.0.5) (2019-03-22)


### Bug Fixes

* **dockerfile:** setting max_old_space_size to 512mb ([8fc2160](https://github.com/Zooz/predator/commit/8fc2160))
* **dockerfile:** setting max_old_space_size to 512mb cli ([bb936f9](https://github.com/Zooz/predator/commit/bb936f9))
* **general:** adjust helm template ([d01dcc1](https://github.com/Zooz/predator/commit/d01dcc1))



<a name="1.0.4"></a>
## [1.0.4](https://github.com/Zooz/predator/compare/v1.0.3...v1.0.4) (2019-03-18)


### Bug Fixes

* **reports:** update runner_id to text instead uuid ([9147da5](https://github.com/Zooz/predator/commit/9147da5))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/Zooz/predator/compare/v1.0.1...v1.0.3) (2019-03-18)


### Bug Fixes

* **reports:** change container_id type in databases to string ([#78](https://github.com/Zooz/predator/issues/78)) ([ef675bd](https://github.com/Zooz/predator/commit/ef675bd))
* ui/package.json & ui/package-lock.json to reduce vulnerabilities ([#103](https://github.com/Zooz/predator/issues/103)) ([da3e552](https://github.com/Zooz/predator/commit/da3e552))
* **reports:** fixing last stats column to be text large for mysql ([73765bf](https://github.com/Zooz/predator/commit/73765bf))
* **ui:** before flow ([#81](https://github.com/Zooz/predator/issues/81)) ([e0a0cd4](https://github.com/Zooz/predator/commit/e0a0cd4))
* **ui:** remove duplicated body when creating test ([#83](https://github.com/Zooz/predator/issues/83)) ([8c0453a](https://github.com/Zooz/predator/commit/8c0453a))


### Features

* **configuration:** add configuration endpoint ([0b8255c](https://github.com/Zooz/predator/commit/0b8255c))
* **fix:** fix ([eba212b](https://github.com/Zooz/predator/commit/eba212b))
* **jobs:** added api to get logs of runners ([c0ef64a](https://github.com/Zooz/predator/commit/c0ef64a))
* **report:** report ([517c99e](https://github.com/Zooz/predator/commit/517c99e))
* **report:** report ([09f9eb6](https://github.com/Zooz/predator/commit/09f9eb6))
* **reporter:** aggregate reports from multi-distributed runners ([0d7b132](https://github.com/Zooz/predator/commit/0d7b132))
* **reporter:** implement aggregate mathematics ([69b58ea](https://github.com/Zooz/predator/commit/69b58ea))
* **reports:** create aggregate reports in UI ([478af4e](https://github.com/Zooz/predator/commit/478af4e))
* **ui:** new report in react ([31bcad5](https://github.com/Zooz/predator/commit/31bcad5))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/Zooz/predator/compare/v1.0.0...v1.0.1) (2019-02-25)


### Bug Fixes

* **avoid ui:** avoid ui audit ([#70](https://github.com/Zooz/predator/issues/70)) ([92d4f7d](https://github.com/Zooz/predator/commit/92d4f7d))
* **jobs:** metrics params send in base 64 format ([#49](https://github.com/Zooz/predator/issues/49)) ([cd48f99](https://github.com/Zooz/predator/commit/cd48f99))
* **jobs:** will pull the docker image of the runner before starting it ([#62](https://github.com/Zooz/predator/issues/62)) ([4ebf829](https://github.com/Zooz/predator/commit/4ebf829))
* **reporter:** allow multiple runners to push stats for same report ([#67](https://github.com/Zooz/predator/issues/67)) ([0425fc1](https://github.com/Zooz/predator/commit/0425fc1))
* **tests:** fix bug where getTests returned all revisions in cassandra ([#50](https://github.com/Zooz/predator/issues/50)) ([aa69465](https://github.com/Zooz/predator/commit/aa69465))


### Features

* **global:** support for external and internal api addresses ([#48](https://github.com/Zooz/predator/issues/48)) ([c85fa83](https://github.com/Zooz/predator/commit/c85fa83))
* **jobs:** support for parallelism in metronome ([#63](https://github.com/Zooz/predator/issues/63)) ([f116410](https://github.com/Zooz/predator/commit/f116410))



<a name="1.0.0"></a>
## [1.0.0](https://github.com/Zooz/predator/compare/54ba808...v1.0.0) (2019-02-11)


### Bug Fixes

* **error handler:** error handler ([298ea72](https://github.com/Zooz/predator/commit/298ea72))
* **fix get all revisions:** fix get all revisions ([3930330](https://github.com/Zooz/predator/commit/3930330))
* **reporter:** adding db casssandra migration scripts ([#17](https://github.com/Zooz/predator/issues/17)) ([41aa7ae](https://github.com/Zooz/predator/commit/41aa7ae))
* **scripts:** add configuration scripts ([54ba808](https://github.com/Zooz/predator/commit/54ba808))


### Features

* **controller,model,database:** get all revisions feature ([19a597a](https://github.com/Zooz/predator/commit/19a597a))
* **jobs:** adding support for parallelism in k8s and max_virtual_users ([#33](https://github.com/Zooz/predator/issues/33)) ([aa5971d](https://github.com/Zooz/predator/commit/aa5971d)), closes [#14](https://github.com/Zooz/predator/issues/14)
* **jobs:** verify test exists before creating/updating job ([#29](https://github.com/Zooz/predator/issues/29)) ([dd62517](https://github.com/Zooz/predator/commit/dd62517)), closes [#26](https://github.com/Zooz/predator/issues/26) [#26](https://github.com/Zooz/predator/issues/26)
* **scheduler:** adding scheduler for running jobs ([831ef93](https://github.com/Zooz/predator/commit/831ef93))
* **tests:** tests api ([1a418c3](https://github.com/Zooz/predator/commit/1a418c3))
