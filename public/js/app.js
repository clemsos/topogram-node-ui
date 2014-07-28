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
        controller: IndexCtrl,
        access: { requiredLogin: false }
      }).
      when('/addPost', {
        templateUrl: 'partials/addPost',
        controller: "AddPostCtrl",
        access: { requiredLogin: true }
      }).
      when('/readPost/:id', {
        templateUrl: 'partials/readPost',
        controller: "ReadPostCtrl",
        access: { requiredLogin: false }
      }).
      when('/editPost/:id', {
        templateUrl: 'partials/editPost',
        controller: EditPostCtrl,
        access: { requiredLogin: true }
      }).
      when('/deletePost/:id', {
        templateUrl: 'partials/deletePost',
        controller: DeletePostCtrl,
        access: { requiredLogin: true }
      }).
      when('/admin/register', {
            templateUrl: 'partials/admin.register.jade',
            controller: 'AdminUserCtrl'
      }).
      when('/admin/login', {
            templateUrl: 'partials/admin.login.jade',
            controller: 'AdminUserCtrl'
      }).
      when('/admin/logout', {
          templateUrl: 'partials/admin.logout.jade',
          controller: 'AdminUserCtrl',
          access: { requiredLogin: true } 
      }).
      otherwise({
        redirectTo: '/'
      });

        $locationProvider
        .html5Mode(true)
        .hashPrefix('!');
}]);

app.run(function($rootScope, $location, AuthenticationService) {
    $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
        if (nextRoute.access.requiredLogin && !AuthenticationService.isLogged) {
            $location.path("/admin/login");
        }
    });
});

// apply interceptor to whole app
app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('TokenInterceptor');
});

// fix for bootstrap 3
app.config(['flashProvider', function(flashProvider) {
  flashProvider.errorClassnames.push('alert-danger');
}])