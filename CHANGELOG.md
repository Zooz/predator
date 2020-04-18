# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.


<a name="1.3.0"></a>
# [1.3.0](https://github.com/Zooz/predator/compare/v1.2.1...v1.3.0) (2020-04-16)


### Features

* **benchmarks** Create a benchmark for a specific test, allowing for easy comparisons between subsequent test runs. ([#280](https://github.com/Zooz/predator/issues/280))
* **reports** Compare multiple tests runs in the UI ([#290](https://github.com/Zooz/predator/issues/290))
* **reports** Edit/Add notes from the reports/last reports screen ([#273](https://github.com/Zooz/predator/issues/273))
* **metrics** Added support for setting custom labels for prometheus ([#278](https://github.com/Zooz/predator/issues/278))
* **configuration** All of the configuration is now available to view and edit through the UI ([#274](https://github.com/Zooz/predator/issues/274))
* **tests** New create/edit test form UI ([#271](https://github.com/Zooz/predator/issues/271)) 
* **tests** Dynamic DSL: DSL tests will be translated to predator tests dynamically ([#283](https://github.com/Zooz/predator/issues/283))

### Bug Fixes
* **reports:** Reports will now show average RPS during the entire test run instead of the last RPS result  ([#292](https://github.com/Zooz/predator/issues/292)) ([fa61a39](https://github.com/Zooz/predator/commit/fa61a39))
* **reports:** fixing grafana link for tests in progress ([#277](https://github.com/Zooz/predator/issues/277)) ([9236774](https://github.com/Zooz/predator/commit/9236774))
* **reports:** Ordering reports by start time in GET: /v1/tests/{test_id}/reports API ([#289](https://github.com/Zooz/predator/issues/289))


<a name="1.2.1"></a>
## [1.2.1](https://github.com/Zooz/predator/compare/v1.2.0...v1.2.1) (2020-03-26)



<a name="1.2.0"></a>
# [1.2.0](https://github.com/Zooz/predator/compare/v1.1.7...v1.2.0) (2020-01-23)


### Bug Fixes

* **fix index html style:** fix index html style ([65f7069](https://github.com/Zooz/predator/commit/65f7069))
* **jobs:** fixing bug where enabled wasn't returned with cassandra ([df7fbc1](https://github.com/Zooz/predator/commit/df7fbc1))
* **typo:** typo date_time to date-time ([6a94a99](https://github.com/Zooz/predator/commit/6a94a99))
* **vulnerabilities:** update npm packages ([#215](https://github.com/Zooz/predator/issues/215)) ([50f0e67](https://github.com/Zooz/predator/commit/50f0e67))


### Features

* **api:** add api spec for processors resource ([#200](https://github.com/Zooz/predator/issues/200)) ([0d22c92](https://github.com/Zooz/predator/commit/0d22c92))
* **clean containers  ui:** clean containers  ui ([b653474](https://github.com/Zooz/predator/commit/b653474))
* **processors:** implement DELETE /processors/{processor_id} ([#231](https://github.com/Zooz/predator/issues/231)) ([8b2d9d0](https://github.com/Zooz/predator/commit/8b2d9d0)), closes [#185](https://github.com/Zooz/predator/issues/185) [#185](https://github.com/Zooz/predator/issues/185) [#200](https://github.com/Zooz/predator/issues/200) [#210](https://github.com/Zooz/predator/issues/210) [#213](https://github.com/Zooz/predator/issues/213) [#214](https://github.com/Zooz/predator/issues/214) [#218](https://github.com/Zooz/predator/issues/218) [#200](https://github.com/Zooz/predator/issues/200) [#185](https://github.com/Zooz/predator/issues/185) [#185](https://github.com/Zooz/predator/issues/185) [#210](https://github.com/Zooz/predator/issues/210) [#217](https://github.com/Zooz/predator/issues/217) [#212](https://github.com/Zooz/predator/issues/212) [#210](https://github.com/Zooz/predator/issues/210) [#186](https://github.com/Zooz/predator/issues/186)
* **processors:** implement GET /processors ([#212](https://github.com/Zooz/predator/issues/212)) ([6a00cd7](https://github.com/Zooz/predator/commit/6a00cd7)), closes [#210](https://github.com/Zooz/predator/issues/210) [#186](https://github.com/Zooz/predator/issues/186)
* **processors:** implement GET /processors/{processor_id} ([#230](https://github.com/Zooz/predator/issues/230)) ([0394723](https://github.com/Zooz/predator/commit/0394723)), closes [#213](https://github.com/Zooz/predator/issues/213) [#214](https://github.com/Zooz/predator/issues/214) [#218](https://github.com/Zooz/predator/issues/218) [#200](https://github.com/Zooz/predator/issues/200) [#185](https://github.com/Zooz/predator/issues/185) [#185](https://github.com/Zooz/predator/issues/185) [#210](https://github.com/Zooz/predator/issues/210) [#217](https://github.com/Zooz/predator/issues/217)
* **processors:** implement PUT /processors/{processor_id} ([#237](https://github.com/Zooz/predator/issues/237)) ([f19a17e](https://github.com/Zooz/predator/commit/f19a17e))
* **jobs:** Add disable/enable scheduled jobs to UI ([#241](https://github.com/Zooz/predator/issues/241)) ([2adf634](https://github.com/Zooz/predator/commit/2adf634))
* **jobs:** add enabled param to jobs ([#238](https://github.com/Zooz/predator/issues/238)) ([fac8887](https://github.com/Zooz/predator/commit/fac8887))
* **jobs:** adding new api for deleting containers for dockers ([8a84536](https://github.com/Zooz/predator/commit/8a84536))
* **jobs:** delete containers api support for k8s ([a17024c](https://github.com/Zooz/predator/commit/a17024c))
* **kill containers:** kill containers ([9d4226c](https://github.com/Zooz/predator/commit/9d4226c))
* **processors:** adding exported functions to processors ([#255](https://github.com/Zooz/predator/issues/255)) ([76f0344](https://github.com/Zooz/predator/commit/76f0344))
* **processors:** verify tests using functions from the processor ([#264](https://github.com/Zooz/predator/issues/264)) ([2ba2d17](https://github.com/Zooz/predator/commit/2ba2d17))
* **tests:** adding processor_id to tests resource ([#240](https://github.com/Zooz/predator/issues/240)) ([8325c58](https://github.com/Zooz/predator/commit/8325c58))



<a name="1.1.7"></a>
## [1.1.7](https://github.com/Zooz/predator/compare/v1.1.6...v1.1.7) (2019-08-27)


### Bug Fixes

* **issues 79 82:** issues 79 82 ([#181](https://github.com/Zooz/predator/issues/181)) ([e53c76f](https://github.com/Zooz/predator/commit/e53c76f)), closes [#79](https://github.com/Zooz/predator/issues/79) [#82](https://github.com/Zooz/predator/issues/82)
* **not supported tool tip:** not supported tool tip ([#184](https://github.com/Zooz/predator/issues/184)) ([d19cbd8](https://github.com/Zooz/predator/commit/d19cbd8))
* package.json & package-lock.json to reduce vulnerabilities ([#203](https://github.com/Zooz/predator/issues/203)) ([872cf23](https://github.com/Zooz/predator/commit/872cf23))


### Features

* **smtp:** support for unauthorized connections ([#170](https://github.com/Zooz/predator/issues/170)) ([7005be5](https://github.com/Zooz/predator/commit/7005be5))



<a name="1.1.6"></a>
## [1.1.6](https://github.com/Zooz/predator/compare/v1.1.5...v1.1.6) (2019-07-30)


### Bug Fixes

* **dsl:** fixing bug where json had to be object ([#173](https://github.com/Zooz/predator/issues/173)) ([7bf0c80](https://github.com/Zooz/predator/commit/7bf0c80))
* **kubernetes:** fix bug where logs wasn't downloaded from kubernetes ([#169](https://github.com/Zooz/predator/issues/169)) ([b62a677](https://github.com/Zooz/predator/commit/b62a677))
* **package:** removing fs and path as they are internal node js modules ([#157](https://github.com/Zooz/predator/issues/157)) ([c246032](https://github.com/Zooz/predator/commit/c246032))


### Features

* **ui:** add configuration page ([#150](https://github.com/Zooz/predator/issues/150)) ([2d0a35d](https://github.com/Zooz/predator/commit/2d0a35d))



<a name="1.1.5"></a>
## [1.1.5](https://github.com/Zooz/predator/compare/v1.1.4...v1.1.5) (2019-06-27)


### Bug Fixes

* package.json & package-lock.json to reduce vulnerabilities ([#151](https://github.com/Zooz/predator/issues/151)) ([2202b45](https://github.com/Zooz/predator/commit/2202b45))


### Features

* **kubernetes:** allow specifiy how much cpu to resrve ([#146](https://github.com/Zooz/predator/issues/146)) ([10a6f3c](https://github.com/Zooz/predator/commit/10a6f3c))
* **kubernetes:** allow specifiy how much cpu to resrve ([#146](https://github.com/Zooz/predator/issues/146)) ([0fc8713](https://github.com/Zooz/predator/commit/0fc8713))



<a name="1.1.4"></a>
## [1.1.4](https://github.com/Zooz/predator/compare/v1.1.3...v1.1.4) (2019-06-01)



<a name="1.1.3"></a>
## [1.1.3](https://github.com/Zooz/predator/compare/v1.1.2...v1.1.3) (2019-05-27)


### Bug Fixes

* **fix tests sort:** fix tests sort ([#142](https://github.com/Zooz/predator/issues/142)) ([523940d](https://github.com/Zooz/predator/commit/523940d))


### Features

* **tests sort by modified:** tests sort by modified ([#141](https://github.com/Zooz/predator/issues/141)) ([139ce27](https://github.com/Zooz/predator/commit/139ce27))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/Zooz/predator/compare/v1.1.1...v1.1.2) (2019-05-20)



<a name="1.1.1"></a>
## [1.1.1](https://github.com/Zooz/predator/compare/v1.1.0...v1.1.1) (2019-05-16)


### Features

* rerun feature, search by enter ([#137](https://github.com/Zooz/predator/issues/137)) ([e340979](https://github.com/Zooz/predator/commit/e340979))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/Zooz/predator/compare/v1.0.10...v1.1.0) (2019-05-16)


### Bug Fixes

* **fix edit test bug:** fix edit test bug ([#135](https://github.com/Zooz/predator/issues/135)) ([7f38d57](https://github.com/Zooz/predator/commit/7f38d57))



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
