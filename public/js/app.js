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
        access: { requiredAuthentication: false }
      }).
      when('/readPost/:id', {
        templateUrl: 'partials/readPost',
        controller: "ReadPostCtrl",
        access: { requiredAuthentication: true }
      }).
      when('/admin', {
        templateUrl: 'partials/index',
        controller: IndexCtrl,
        access: { requiredAuthentication: true }
      }).
      when('/admin/addPost', {
        templateUrl: 'partials/addPost',
        controller: "AddPostCtrl",
        access: { requiredAuthentication: true }
      }).
      when('/admin/readPost/:id', {
        templateUrl: 'partials/readPost',
        controller: "ReadPostCtrl",
        access: { requiredAuthentication: true }
      }).
      when('/admin/editPost/:id', {
        templateUrl: 'partials/editPost',
        controller: EditPostCtrl,
        access: { requiredAuthentication: true }
      }).
      when('/admin/deletePost/:id', {
        templateUrl: 'partials/deletePost',
        controller: DeletePostCtrl,
        access: { requiredAuthentication: true }
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
          access: { requiredAuthentication: true } 
      }).
      otherwise({
        redirectTo: '/'
      });

        $locationProvider
        .html5Mode(true)
        .hashPrefix('!');
}]);

app.run(function($rootScope, $location, $window, AuthenticationService) {
    $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
        //redirect only if both isAuthenticated is false and no token is set
        if (nextRoute != null && nextRoute.access != null && nextRoute.access.requiredAuthentication 
            && !AuthenticationService.isAuthenticated && !$window.sessionStorage.token) {

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