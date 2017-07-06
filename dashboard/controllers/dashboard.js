function MasterCtrl($scope) {
	'use strict';
	$scope.test = 'heyyyyy';
	console.log($scope.test);
}

function RecentCtrl($scope, $http, $q, $mdPanel) {
	'use strict';
	$scope.shows = {};
	$scope.active = {};

	$http({
		method: 'GET',
		url: 'https://api.themoviedb.org/3/configuration',
		params: {
			api_key: '59764f86744ef1c878d73bd71a7e79a3',
		}
	}).then(function(resp) {
		console.log(resp.data);
		$scope.baseURL = resp.data.images.base_url + resp.data.images.poster_sizes[0];
	}, function(err) {
		console.log(err);
	});

	$scope.shows = $http.get('/api/status').then(function(resp) {
		$scope.shows = resp.data;
		console.log($scope.shows);
		/*for(var i = 0; i < 10; i++) {
			var showTitle = resp.data[i].Title.substr(0, resp.data[i].Title.indexOf('(') - 1);
			$scope.shows[i].showTitle = showTitle;
			getShow(showTitle, i);
		}*/
	});

	$scope.setActive = function(show) {
		$scope.active = show;
		$scope.active.showTitle = show.Title.substr(0, show.Title.indexOf('(') - 1).trim();
		$scope.active.epNumber = show.Title.match(/s\d+e\d+/)[0].toUpperCase().trim();
		$scope.active.epTitle = show.Title.match(/s\d+e\d+\).+/)[0].trim();
		$scope.active.epTitle = $scope.active.epTitle.substr($scope.active.epNumber.length + 1, $scope.active.epTitle.length).trim();
	};

	function getShow(showTitle, i) {
		return $http({
			method: 'GET',
			url: 'https://api.themoviedb.org/3/search/tv',
			params: {
				api_key: '59764f86744ef1c878d73bd71a7e79a3',
				query: showTitle
			}
		}).then(function(resp) {
			console.log(resp);
			$scope.shows[i].metadata = resp.data.results[0];
		});
	}
}

angular
	.module('app')
	.controller('MasterCtrl', MasterCtrl)
	.controller('RecentCtrl', RecentCtrl);
