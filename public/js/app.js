'use strict';

// Declare app level module which depends on filters, and services
var app = angular.module('topogram', 
    [
    'ngResource', 
    'ngRoute',
    'elasticsearch',
    'ngTable',
    'angular-flash.service', 
    'angular-flash.flash-alert-directive'
    ]);

// routes
app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider.
      when('/', {
        templateUrl: 'partials/index',
        controller: IndexCtrl
      }).
      when('/addPost', {
        templateUrl: 'partials/addPost',
        controller: "AddPostCtrl"
      }).
      when('/readPost/:id', {
        templateUrl: 'partials/readPost',
        controller: "ReadPostCtrl"
      }).
      when('/editPost/:id', {
        templateUrl: 'partials/editPost',
        controller: EditPostCtrl
      }).
      when('/deletePost/:id', {
        templateUrl: 'partials/deletePost',
        controller: DeletePostCtrl
      }).
      otherwise({
        redirectTo: '/'
      });

        $locationProvider
        .html5Mode(true)
        .hashPrefix('!');
}]);

// fix for bootstrap 3
app.config(['flashProvider', function(flashProvider) {
  flashProvider.errorClassnames.push('alert-danger');
}])