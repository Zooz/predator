# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.6.3](https://github.com/Zooz/predator/compare/v1.6.2...v1.6.3) (2021-09-23)


### Bug Fixes

* fixing the create test flow issue because of additionalInfo no default object ([3ce86b3](https://github.com/Zooz/predator/commit/3ce86b3a05ee6703510a71ed21765fd479e52242))
* update sqlite ([#583](https://github.com/Zooz/predator/issues/583)) ([590b2fa](https://github.com/Zooz/predator/commit/590b2fa2d86620d9bab6dde770907fe211ff66d7))

### [1.6.2](https://github.com/Zooz/predator/compare/v1.6.1...v1.6.2) (2021-04-18)


### Bug Fixes

* package.json & package-lock.json to reduce vulnerabilities ([#576](https://github.com/Zooz/predator/issues/576)) ([8283914](https://github.com/Zooz/predator/commit/8283914a19a6340235a0ec611a7e8702548c51ac))
* produce test's benchmark data when exists ([#578](https://github.com/Zooz/predator/issues/578)) ([dfecb58](https://github.com/Zooz/predator/commit/dfecb58d48699141afd4e36464f81537171294dd))
* vulnerabilities ([#577](https://github.com/Zooz/predator/issues/577)) ([5f281ab](https://github.com/Zooz/predator/commit/5f281ab7850e4c8ddcdb63a427c8eff955927c9b))

### [1.6.1](https://github.com/Zooz/predator/compare/v1.6.0...v1.6.1) (2021-03-16)


### Bug Fixes

* add report benchmark data to database migration scripts ([#570](https://github.com/Zooz/predator/issues/570)) ([2c08a83](https://github.com/Zooz/predator/commit/2c08a8356179081d617fba3055ee83e3afed2b03))
* package.json & package-lock.json to reduce vulnerabilities ([#568](https://github.com/Zooz/predator/issues/568)) ([0ec0fd7](https://github.com/Zooz/predator/commit/0ec0fd764ac3459754e76030650f20c5c986aa04))
* success ratio in report pages shows too many decimals ([#566](https://github.com/Zooz/predator/issues/566)) ([93ad984](https://github.com/Zooz/predator/commit/93ad98491c14189d9f39efab5f17129b1b8a8ae1))
* ui/package.json & ui/package-lock.json to reduce vulnerabilities ([#567](https://github.com/Zooz/predator/issues/567)) ([0e4a482](https://github.com/Zooz/predator/commit/0e4a482d89c88fa334a4e3f684238defec3f3394))

## [1.6.0](https://github.com/Zooz/predator/compare/v1.5.4...v1.6.0) (2021-02-15)


### Features

* **streaming:** add published_at attribute to published resources ([#558](https://github.com/Zooz/predator/issues/558)) ([8c5d5ed](https://github.com/Zooz/predator/commit/8c5d5edbce6f0e90b2d3c2a60a65e669f14917b1))
* **streaming:** add kafka integration for publishing events and resources ([#557](https://github.com/Zooz/predator/issues/557)) ([d6bcd4a](https://github.com/Zooz/predator/commit/d6bcd4a0a20ea1353336546db7dc2013416816d3))
* **context:** ability to create resources under a specific context ([#522](https://github.com/Zooz/predator/issues/522)) ([d645588](https://github.com/Zooz/predator/commit/d64558820ec425209d5b9c1832f8ffaaee7b76ba))
* **platforms:** support aws-fargate as job platform ([8cf556d](https://github.com/Zooz/predator/commit/8cf556da7379400c479265c519c6f46f763f1118))
* **report:** show stats about runners in report page ([#493](https://github.com/Zooz/predator/issues/493)) ([648aaeb](https://github.com/Zooz/predator/commit/648aaeb6868f16445f81c56d4b2fb396c7aa4cf5))
* **test:** after test run, redirect to report with slider ([056e39b](https://github.com/Zooz/predator/commit/056e39b06da2330803db0c24c5b2b9cf940d9517))
* **steps:** enabling gzip by defaultt ([#492](https://github.com/Zooz/predator/issues/492)) ([2545ef2](https://github.com/Zooz/predator/commit/2545ef23eff102fcc06b36e7ccff3948e149612d))
* **tests:** add favorites - issue [#508](https://github.com/Zooz/predator/issues/508) ([#533](https://github.com/Zooz/predator/issues/533)) ([8bb3ad5](https://github.com/Zooz/predator/commit/8bb3ad5b37775e359243c216c9d138222f7f02ea))
* **ui:** sticky test form actions ([#496](https://github.com/Zooz/predator/issues/496)) ([fba8894](https://github.com/Zooz/predator/commit/fba8894505fd4aafce59576686998456aa7ffcd9))
* **webhooks:** added a test webhook endpoint ([#530](https://github.com/Zooz/predator/issues/530)) ([b152d8a](https://github.com/Zooz/predator/commit/b152d8a3c40b03e2aef81275592099a4a586651a))
* **webhooks:** adding ms teams incoming webhook notification support ([fb58064](https://github.com/Zooz/predator/commit/fb580646fc5bf45176e2b09c213ca75f4040dfb7))
* **webhooks:** Webhooks discord ([#536](https://github.com/Zooz/predator/issues/536)) ([9bae29a](https://github.com/Zooz/predator/commit/9bae29a8b08d987dae31f45fed00adc55be9b95a))


### Bug Fixes

* ui/package.json & ui/package-lock.json to reduce vulnerabilities ([#552](https://github.com/Zooz/predator/issues/552)) ([51eb74d](https://github.com/Zooz/predator/commit/51eb74d118028ba48f499551d36fd7aa04e13f74))
* vulnerabilities ([#556](https://github.com/Zooz/predator/issues/556)) ([43578a7](https://github.com/Zooz/predator/commit/43578a7724f9a512737a2dcc168646caa78abde8))
* **jobs:** job-started streaming message missing job_id ([#561](https://github.com/Zooz/predator/issues/561)) ([b2bdb4e](https://github.com/Zooz/predator/commit/b2bdb4e6a4eb1e0669c41b48076c4856455f8e8d))
* **jobs:** not jumping to report screen after running scheduled only test ([f54afe2](https://github.com/Zooz/predator/commit/f54afe2a0c4729fd55ab9af3841d285764069c04))
* **jobs:** produce job to streaming platform only when started run ([#562](https://github.com/Zooz/predator/issues/562)) ([f8e43db](https://github.com/Zooz/predator/commit/f8e43db3a5528347dfe5363b22f2fbce885be947))
* **431:** default expanded to false for CollapsibleStep ([#456](https://github.com/Zooz/predator/issues/456)) ([0fe396e](https://github.com/Zooz/predator/commit/0fe396eb2f397f66b8dcb4174978944a92d0ebdb))
* **api:** change prometheus bucket size to array ([60b1d7f](https://github.com/Zooz/predator/commit/60b1d7fc317c77810c96d12956b1c1227c7d7ca1))
* **body-parser:** allow configure max payload size by setting BODY_PARSER_LIMIT env var ([1701c40](https://github.com/Zooz/predator/commit/1701c4033ecda95734046e5ae367027d56bdfe1d))
* **boot:** fail startup when config endpoint not reachable only for docker platform ([c17996b](https://github.com/Zooz/predator/commit/c17996b8a211bc73459bc39612fdd90d0ad5c4d4))
* **dcos:** fix dcos integration ([af31828](https://github.com/Zooz/predator/commit/af31828ca4c62413e1ec9949c99c402dae32c60b))
* **tests:** fix bug where it was impossible to delete test ([db2ec47](https://github.com/Zooz/predator/commit/db2ec4767c442d372ddd9e8d1f50e308224b4145))
* **deps:** remove unused deps ([72aceb9](https://github.com/Zooz/predator/commit/72aceb9c798557510ceed967a9b5900255a3a75d))
* **favorite-tests:** fix merge ([15ce3eb](https://github.com/Zooz/predator/commit/15ce3eb974599a5ded24d4ff0c09c036e084da9b))
* **invalid_test:** show error popup if test data is invalid ([#516](https://github.com/Zooz/predator/issues/516)) ([fa93612](https://github.com/Zooz/predator/commit/fa93612ca42bb65963057c0c2e3bd25ebc709708))
* **jobs:** Disable deleting scheduled test ([#524](https://github.com/Zooz/predator/issues/524)) ([50bf2ec](https://github.com/Zooz/predator/commit/50bf2ecd672d9a2d23087aa19b480766ed9224d2))
* **jobs, reports:** fail report as failed immediately on job creation failure ([#540](https://github.com/Zooz/predator/issues/540)) ([94d7907](https://github.com/Zooz/predator/commit/94d7907c65f6156f3b12b73cbacc5bdc793bbeb6))
* **reports:** add tag param to reports ([#551](https://github.com/Zooz/predator/issues/551)) ([9a810b9](https://github.com/Zooz/predator/commit/9a810b9c2b413e9e6f6431b37bf787355b014b5a))
* **reports:** fix report export download in production mode ([#501](https://github.com/Zooz/predator/issues/501)) ([f175d51](https://github.com/Zooz/predator/commit/f175d5192e2e4e32e74eacd2102b343844c6860c))
* **reports:** show all reports when favorites toggle is off ([#535](https://github.com/Zooz/predator/issues/535)) ([379ced4](https://github.com/Zooz/predator/commit/379ced491873d11604ae736eb2813f26daed8f0d))
* **ui:** fix loading report ([#534](https://github.com/Zooz/predator/issues/534)) ([3b5e5ff](https://github.com/Zooz/predator/commit/3b5e5ffd5ac386a5d70b2c932845d19ff3c05bf3))
* **ui:** rename submit to save in create test form ([5d8342c](https://github.com/Zooz/predator/commit/5d8342cf02f50a29e6cdc44314e50fd0adeefb59))
* **ui:** revert environment ([#447](https://github.com/Zooz/predator/issues/447)) ([d1f6801](https://github.com/Zooz/predator/commit/d1f68012f903b8bc6eb046eebac35d3abc829445))
* **ui:** fix collapsible on edit test ([#467](https://github.com/Zooz/predator/issues/467)) ([c8df1c1](https://github.com/Zooz/predator/commit/c8df1c1a9586281c165dc7d4636c3228fb8ba8e5))
* **ui:** fix baseurl map ([cc3609b](https://github.com/Zooz/predator/commit/cc3609b46460c8ee8531d020a57671e5110b21d2))
* **ui:** fix build ([2d08711](https://github.com/Zooz/predator/commit/2d08711f55c986319248273230cc43162ba3fd4e))
* **ui:** fix edit job ([#510](https://github.com/Zooz/predator/issues/510)) ([d0d4b2b](https://github.com/Zooz/predator/commit/d0d4b2be4637937e12d3708d7a0d6d9e880afdb3))
* **ui:** fix edit test ([#542](https://github.com/Zooz/predator/issues/542)) ([92aa3d4](https://github.com/Zooz/predator/commit/92aa3d4133a8ce3cc708dd5a265fbb772a9448ba))
* **url:** show error if urls don't have protocol and disable test run … ([#517](https://github.com/Zooz/predator/issues/517)) ([c5250bc](https://github.com/Zooz/predator/commit/c5250bc0849e723d2b05d02aba9fbad630b49dd8))
* **webhooks:** allow testing webhooks without saving them ([#547](https://github.com/Zooz/predator/issues/547)) ([6c429e7](https://github.com/Zooz/predator/commit/6c429e784acefb0f83f5cca121eb5319b0b4845a))
* **jobs:** add cron validation to jobVerifier ([#457](https://github.com/Zooz/predator/issues/457)) ([0ca0011](https://github.com/Zooz/predator/commit/0ca00115fdb86e98143dc0767f3a35be3e7fe5f5))
* increase report failure threshold to 3 minutes ([b2b8873](https://github.com/Zooz/predator/commit/b2b887345f6fd2dd43b2737a683ab1c3144361a3))
* remove uuid restriction on x-runner-id header ([698d18d](https://github.com/Zooz/predator/commit/698d18d2ee1534da14704c9b065aa30a789f71c0))

### [1.5.4](https://github.com/Zooz/predator/compare/v1.5.3...v1.5.4) (2020-10-01)


### Features

* **server:** verify INTERNAL_ADDRESS is reachable and correct ([#430](https://github.com/Zooz/predator/issues/430)) ([64e0b04](https://github.com/Zooz/predator/commit/64e0b0490842e6a614a6e7fd7c822a73a20cde8e))


### Bug Fixes

* **delete all console logs:** delete all console logs ([454c62e](https://github.com/Zooz/predator/commit/454c62e4623798fc7df5205c370f2d6ae784cdf4))
* **deps:** upgrade ui deps ([#435](https://github.com/Zooz/predator/issues/435)) ([bbc4041](https://github.com/Zooz/predator/commit/bbc40416a81fbb6159e8f77ce7da7c4a290b65f3))
* **local-run:** add /v1/ to INTERNAL_ADDRESS ([26bd534](https://github.com/Zooz/predator/commit/26bd5346217b59d8c8d564d6a872e773274e8f0a))
* **openapi:** fixed missing schema key ([#414](https://github.com/Zooz/predator/issues/414)) ([f39d7f8](https://github.com/Zooz/predator/commit/f39d7f8571797fab4b3f30627b9ed1cbf28a24ea))
* **reports:** return report stats sorted by timestamp ([#443](https://github.com/Zooz/predator/issues/443)) ([34d30c0](https://github.com/Zooz/predator/commit/34d30c04ae7dd69f7afa439f82387f86a5e35993))
* **ui-fix-schedule-button:** ui-fix-schedule-button ([dc11d86](https://github.com/Zooz/predator/commit/dc11d8682bbd3b464633a24e28507031d0f5d8e8))

### [1.5.3](https://github.com/Zooz/predator/compare/v1.5.2...v1.5.3) (2020-09-25)

### [1.5.2](https://github.com/Zooz/predator/compare/v1.5.1...v1.5.2) (2020-09-23)


### Bug Fixes

* **ui:** fix collapse z index level ([#400](https://github.com/Zooz/predator/issues/400)) ([7a04895](https://github.com/Zooz/predator/commit/7a048953d4032e6432d919e241ff6e4032002356))

### [1.5.1](https://github.com/Zooz/predator/compare/v1.5.0...v1.5.1) (2020-09-21)


### Bug Fixes

* **db:** jobs arrival_count migration ([#399](https://github.com/Zooz/predator/issues/399)) ([34322ca](https://github.com/Zooz/predator/commit/34322ca65faf862f96f829f2f8723043c04166fc))

## [1.5.0](https://github.com/Zooz/predator/compare/v1.4.1...v1.5.0) (2020-09-20)


### Features

* **reports:** add favorite reports support ([a00f10a](https://github.com/Zooz/predator/commit/a00f10a8647b3cc40506adcfd57cade7889d80d1))
* **ui:** support xml and forms content-type when creating tests ([#368](https://github.com/Zooz/predator/issues/368)) ([8057c1a](https://github.com/Zooz/predator/commit/8057c1a423dc99b99e7147aa7cc03374c8d78f93))
* **ui:** add assertions ([cbd9e62](https://github.com/Zooz/predator/commit/cbd9e62a1047af812c5337d0ac5065f0ca8fc3b1))
* **ui:** add step name to requests ([5f055cd](https://github.com/Zooz/predator/commit/5f055cd30dd15dd83ce152ed2deda061218bbed4))
* **ui:** add webhooks support ([2104c41](https://github.com/Zooz/predator/commit/2104c41ec3d7ca633f9edd7856d4829a44fd1ad1))
* **webhooks:** add new webhooks API ([9db2c66](https://github.com/Zooz/predator/commit/9db2c6600fbeb9cecf527cd3b9500450d9649409))
* **functional tests:** support functional tests and assertions ([#360](https://github.com/Zooz/predator/issues/360)) ([c129d2a](https://github.com/Zooz/predator/commit/c129d2a07a4f88a224edee732123838a8289b0c3))


### Bug Fixes

* **webhooks**: reduce payload size by removing aggregated report from json webh… ([#380](https://github.com/Zooz/predator/issues/380)) ([bc77c4a](https://github.com/Zooz/predator/commit/bc77c4a8094104413c888bf27003d4092eb445fe))
* **config:** allow unlimited text for config values ([#394](https://github.com/Zooz/predator/issues/394)) ([80703f7](https://github.com/Zooz/predator/commit/80703f78cdce1fd60eaff1ea0344ac6533ece4e8)), closes [#393](https://github.com/Zooz/predator/issues/393)
* **configuration:** remove webhooks from configuration ([#386](https://github.com/Zooz/predator/issues/386)) ([28ce997](https://github.com/Zooz/predator/commit/28ce997452f13bba097d202e5ea4c2f513f4741f))
* **db:** drop Cassandra support ([#361](https://github.com/Zooz/predator/issues/361)) ([7ac4f59](https://github.com/Zooz/predator/commit/7ac4f59f048dc99d4527f6fd1974b03df3bf9a06))
* **runner:** use semver of runner as predator ([#395](https://github.com/Zooz/predator/issues/395)) ([670d0d6](https://github.com/Zooz/predator/commit/670d0d6abe06fb27e52a3672dc7b52626115b966))
* **webhooks:** order webhooks by updated_at desc ([a14453a](https://github.com/Zooz/predator/commit/a14453a89926e5645f282966a435f471cccd83dc))
* **webhooks:** verify put /v1/webhooks receives full body request [#383](https://github.com/Zooz/predator/issues/383) ([#387](https://github.com/Zooz/predator/issues/387)) ([e3b0fd2](https://github.com/Zooz/predator/commit/e3b0fd2fa7a7150eaa82abb6f99cd58f05cb7b53))
* **webhooks:** when webhook id not exists while creating job return 400 [#382](https://github.com/Zooz/predator/issues/382) ([#388](https://github.com/Zooz/predator/issues/388)) ([bedc452](https://github.com/Zooz/predator/commit/bedc452f695588cfe86f2ef31a13d302dfb5c720))

### [1.4.1](https://github.com/Zooz/predator/compare/v1.4.0...v1.4.1) (2020-09-03)


### Features

* **ui:** ability to clone test ([#357](https://github.com/Zooz/predator/issues/357)) ([c839f97](https://github.com/Zooz/predator/commit/c839f975bf24b75514c90b1f31f37cecb930e9f7)), closes [#350](https://github.com/Zooz/predator/issues/350) [#352](https://github.com/Zooz/predator/issues/352)


### Bug Fixes

* **ui:** fixing missing required lodash ([#365](https://github.com/Zooz/predator/issues/365)) ([fb82301](https://github.com/Zooz/predator/commit/fb82301e6f411a39b6910467afd7cccf3d5c7074))

## [1.4.0](https://github.com/Zooz/predator/compare/v1.3.1...v1.4.0) (2020-07-23)


### Features
* **reports** Show benchmark results on test report graph when benchmark is set. ([#346](https://github.com/Zooz/predator/issues/346))
* **test-generator** Support for upload csv files and use them as data for test. ([#268](https://github.com/Zooz/predator/issues/268))
* **compare-reports:** add notes to ui compare reports ([#314](https://github.com/Zooz/predator/issues/314)) ([5303acd](https://github.com/Zooz/predator/commit/5303acde9681a2b05faf070a65291581117d17be))
* **test-generator:** set keep-alive as default ([#299](https://github.com/Zooz/predator/issues/299)) ([04eb8d1](https://github.com/Zooz/predator/commit/04eb8d188197722190e4eb8cc36decbb1fc2d247))
* **reports:** api and ui for delete reports ([#337](https://github.com/Zooz/predator/issues/337)) ([8e68471](https://github.com/Zooz/predator/commit/8e68471e6f7b9f8dd02e76681983e54e162e64d7))
* **runner:** support custom job template ([ad191e9](https://github.com/Zooz/predator/commit/ad191e99c7cf760c0a3715abbd028cf8f56c9441))
* **test-generator:** added sleep and extra http methods ([#323](https://github.com/Zooz/predator/issues/323)) ([6ac9a53](https://github.com/Zooz/predator/commit/6ac9a532ea49900e36ae16d01add5f2e15e4d99d))


### Bug Fixes

* **docker:** fixing docker debug logs to include stderr ([#338](https://github.com/Zooz/predator/issues/338)) ([8498a3d](https://github.com/Zooz/predator/commit/8498a3d1dca268d20c8c28a247e123cdedfc5914))
* **last_reports:** notes render bug ([#331](https://github.com/Zooz/predator/issues/331)) ([5440e5a](https://github.com/Zooz/predator/commit/5440e5a6f4716640d152f7f8c5ef6a136b121cf2))
* **reports:** fix avg rps when notes are updated ([#328](https://github.com/Zooz/predator/issues/328)) ([4dc8e9d](https://github.com/Zooz/predator/commit/4dc8e9dc72d6886087d80aeeb17555d3d46dd876))

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
