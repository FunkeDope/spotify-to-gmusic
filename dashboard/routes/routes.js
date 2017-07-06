app.config(['$stateProvider', '$urlRouterProvider', "$locationProvider", function($stateProvider, $urlRouterProvider, $locationProvider) {
	'use strict';
	'ngInject';
	$locationProvider.html5Mode(true);

	//$urlRouterProvider
	//   .when('/', '/dashboard/recent');
	//	.when('/cases', '/cases/home')
	//	.otherwise('/cases/home');

	$stateProvider

		.state('dashboard', {
			url: "/dashboard",
			abstract: true,
			templateUrl: "views/common/content.html"
		})
		.state('dashboard.recent', {
			url: "/home",
			templateUrl: "views/dashboard/home.html"
		});


}]);
