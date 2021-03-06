/**
 * Created by yguskov on 22.06.17.
 */

// global. currently active menu item
var current_item = 0;

// few settings
var section_hide_time = 600;
var section_show_time = 600;

var pageSize = 6;

var app = angular.module('myApp', ['ui.bootstrap', 'ngAnimate', 'slickCarousel', 'ngRoute', '720kb.socialshare', 'dndLists'])
    .filter('nl2br', ['$sce', function($sce){
        return function(val) {
            var str =  val.replace(/\n/g, '<br>');
            return $sce.trustAsHtml(str);
        };
    }])
    .config( [
        '$compileProvider',
        function( $compileProvider )
        {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|whatsapp):/);
            // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
        }
    ])
    .config(function($routeProvider, $locationProvider) {
        $routeProvider.otherwise( {  } );
        $locationProvider.html5Mode({ enabled: true, requireBase: false, rewriteLinks: false });
    })
    .run(function($rootScope, $location) {
        $rootScope.location = $location;
        $rootScope.author = { name: 'Анатолий Гуськов'};
        $rootScope.baseUrl = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    });

app.controller('common', [ '$scope', '$http', '$location',  '$window', '$sce', function($scope, $http, $location, $window, $sce) {
    $scope.seo = { title: 'Aнатолий Гуськов - стихи', description: 'Aнатолий Алексеевич Гуськов - стихи' };

    $scope.active = '#about';
    $scope.listIndex = [];
    $scope.pageSize = pageSize;


    // for searching
    $scope.selected = undefined;
    $scope.states = [];
    $scope.stems = [];

    $scope.$on( "$routeChangeStart", function(event, next, current) {
        //     if ($rootScope.loggedInUser == null) {
        //         // no logged user, redirect to /login
        //         if ( next.templateUrl === "partials/login.html") {
        //         } else {
        //             $location.path("/login");
        //         }
        //     }
        var new_url = $location.path();
        switch($location.path()) {
            case '/' :
                $scope.showSection('#head');
                $scope.seo = { title: 'стихи', description: 'Aнатолий Алексеевич Гуськов - стихи' };
                break;
            case '/search' :
                $scope.showSection('#search');
                $scope.seo = { title: 'поиск', description: 'Aнатолий Алексеевич Гуськов - поиск' };
                break;
            case '/poem' :
                $scope.openPoem($location.search().id);
                new_url = new_url + '?id='+$location.search().id;
                break;
            case '/all' :
                $scope.listAll();
                $scope.showSection('#all');
                $scope.seo = { title: 'все стихи', description: 'Aнатолий Алексеевич Гуськов - все стихи' };
                break;
            case '/photo' :
                $scope.showSection('#photo');
                $scope.seo = { title: 'фото', description: 'Aнатолий Алексеевич Гуськов - фото' };
                break;
        }
        setTimeout(function() { ga_move(new_url, $scope.seo.title) }, 300);
    });

    var stemmer = new RussianStemmer();

    $scope.openPoem = function(id) {
        $scope.askApi('get', '/api/articles/' + id, { }, function (resp) {
            $scope.article = resp.data.article;
            $scope.article.quatrains = resp.data.article.text.split("\n\n");
            $scope.seo = { title: resp.data.article.title, description: resp.data.article.description };
            current_item = 1;
            $scope.showSection('#about');
        });
    }

    $scope.listAll = function() {
        if($scope.list==undefined) $scope.askApi('get', '/api/articles/', {}, function(resp) {
            $scope.setList(resp.data);

            setTimeout(function(){ $('.slider').slick({dots: true}); }, 2000);
        });
    }

    $scope.init = function () {

    };

    $scope.onedit = function() {
        $scope.states = [];
        $scope.stems = [];
        if($scope.selected.length>2) {
            $scope.selected.split(' ').forEach(function (word) {
                $scope.stems.push(stemmer.stemWord(word));
            });

            $scope.askApi('get', '/api/articles/search/'+$scope.selected, {}, function (resp) {
                for (var i = 0; i < resp.data.length; i++) {
                    $scope.states.push({
                        'id': resp.data[i]._id,
                        'title': resp.data[i].title,
                        'text': resp.data[i].text,
                        'line': resp.data[i].description});
                }
            });
        }
    };

    $scope.selectMatch = function($index) {
        $scope.open($scope.states[$index].id);
        $scope.selected = undefined;
        $scope.states = [];
        $scope.stems = [];
    };

    $scope.setList = function(data) {
        $scope.list = data;

        for (var i = 0; i < data.length/pageSize; i++) {
            $scope.listIndex.push(i*pageSize);
        }
    }

    $scope.selectMenu = function(id) {
        switch (id) {
            case '#head' :
                $location.path('/');
                break;

            case '#search' :
                $location.path('/search');
                break;

            case '#about' :
                break;

            case '#all' :
                $location.path('/all');
                break;

            case '#photo' :
                $location.path('/photo');
                break;
        }

        // $('.navbar-toggle').click();
        // $scope.showSection(id);
        // if( ! $(this).hasClass('active') ) {
        //     current_item = this;
        //     // close all visible divs with the class of .section
        // }
    };

    $scope.showSection = function(section) {
        if($('.section:visible').length==0) {
            $('a[href="' + section + '"]').addClass('active');
            $(section).fadeIn(section_show_time);
        }
        else {
            $('.section:visible').fadeOut(section_hide_time, function () {
                $('a', '.mainmenu').removeClass('active');
                $('a[href="' + section + '"]').addClass('active');
                $(section).fadeIn(section_show_time);
            });
        }
    }

    $scope.isPageHide = function(offset) {
        if(offset>=$scope.pageSize) return 'hide';
        else return '';
    }

    $scope.edit = function(id) {
        if(id!=0) {
            $scope.askApi('get', '/api/articles/'+id, {}, function (resp) {
                $scope.model = resp.data.article;
                $('#all').fadeOut(300, function () {
                    $('#edit').fadeIn(600);
                });
            });
        }
        else {
            $scope.model = {};
            $('#all').fadeOut(300, function () {
                $('#edit').fadeIn(600);
            });
        }
    };

    $scope.open = function(id) {
        if(id!=0) {
            // $location.path('http://aguskov.org/#!?poem='+id);
            $location.path('poem');
            $location.search('id', id);

            // $scope.openPoem(id);
            // $window.location.reload();
        }
    };

    $scope.cancel = function(id) {
            $scope.model = undefined;
            $('#edit').fadeOut( 300, function() {
                $('#all').fadeIn(600);
            });
    };

    $scope.save = function() {
        if($scope.model._id==undefined) {
            $scope.askApi('post', '/api/articles', $scope.model, function (resp) {
                $scope.list.push(resp.data.article);
                $('#edit').fadeOut(300, function () {
                    $('#all').fadeIn(600);
                });
            });
        }
        else {
            $scope.askApi('put', '/api/articles/' + $scope.model._id, $scope.model, function (resp) {
                    var i = $scope.list.findIndex(function(item) { return item._id==resp.data.article._id });
                    $scope.list[i] = resp.data.article;

                    $('#edit').fadeOut(300, function () {
                        $('#all').fadeIn(600);
                    });
            });
        }

        //
        // $http.put('http://aguskov.org/api/articles/'+id, { headers: { Authorization:'Bearer '+localStorage.getItem('token') } }).then(function(resp) {
        //     $scope.model = resp.data.article;
        //     $('#all').fadeOut( 300, function() {
        //         $('#edit').fadeIn(600);
        //     });
        // });
    };

    $scope.login = function() {
        if ($scope.user.username !== '' && $scope.user.password !== '') {
            $http.post($scope.baseUrl+'/api/oauth/token', {
                    grant_type: 'password',
                    client_id: 'android',
                    client_secret: 'SomeRandomCharsAndNumbers',
                    username: $scope.user.username,
                    'password': $scope.user.password},
                { headers: {'Content-Type': 'application/json'}})
                .then(function(resp) {
                    localStorage.setItem('username', $scope.user.username);
                    localStorage.setItem('token', resp.data.access_token);
                    $window.location.href = '/'
                    }, function() { console.log('Auth error');
                });
        }
    }

    $scope.logout = function() {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        $window.location.href = '/'
    }

    $scope.isAdmin = function() {
        return localStorage.getItem('username') !== null && localStorage.getItem('username') !== 'myapi';
    }

    $scope.isDefined = function (thing) {
        return !(typeof thing === "undefined");
    };

    $scope.seoUrl = function(articleId) {
        return $scope.baseUrl+'/pub/poem?id='+articleId;
    };

    /**
     * Request to api
     * @param method
     * @param url
     * @param parameters
     * @param callback
     */
    $scope.askApi = function(method, url, parameters, callback) {
        $http({
            method: method.toUpperCase(),
            url: $scope.baseUrl+url,
            headers: {Authorization: 'Bearer ' + localStorage.getItem('token')},
            data: parameters
        }).then(callback, function onError(response) {
            $scope.authApi(method, url, parameters, callback);
        });
    }

    $scope.authApi = function(method, url, parameters, callback) {
        var username = 'myapi';
        var password = 'abc1234';
        if(localStorage.getItem('username')) {
            username = localStorage.getItem('username');
            // ask auth
            password = prompt('Пароль?','');
        }
        $http.post($scope.baseUrl+'/api/oauth/token', {
                grant_type: 'password',
                client_id: 'android',
                client_secret: 'SomeRandomCharsAndNumbers',
                username: username,
                'password': password},
            { headers: {'Content-Type': 'application/json'}})
            .then(
                function (resp) {
                    localStorage.setItem('token', resp.data.access_token);
                    $http({
                        method: method.toUpperCase(),
                        url: $scope.baseUrl+url,
                        headers: {Authorization: 'Bearer ' + localStorage.getItem('token')},
                        data: parameters
                    }).then(callback, function onError(response) { console.log('No auth error');}); },
                function(response) {
                    if(confirm('Зайти обычным пользователем')) {
                        var username = 'myapi';
                        var password = 'abc1234';
                        $http.post($scope.baseUrl + '/api/oauth/token', {
                                grant_type: 'password',
                                client_id: 'android',
                                client_secret: 'SomeRandomCharsAndNumbers',
                                username: username,
                                'password': password
                            },
                            {headers: {'Content-Type': 'application/json'}})
                            .then(
                                function (resp) {
                                    localStorage.setItem('token', resp.data.access_token);
                                    $http({
                                        method: method.toUpperCase(),
                                        url: $scope.baseUrl + url,
                                        headers: {Authorization: 'Bearer ' + localStorage.getItem('token')},
                                        data: parameters
                                    }).then(callback, function onError(response) {
                                        console.log('No auth error');
                                    });
                                },
                                function (response) {
                                    console.log('Still have not token');
                                });
                    }
                    else {
                        console.log('Still have not own token');
                    }
                });
    }

    $scope.firstHalf = function(items) {
        if(typeof items !== 'undefined') {
            return items.slice(0, Math.ceil(items.length / 2));
        }
        else return [];
    }

    $scope.lastHalf = function(items) {
        if(typeof items !== 'undefined') {
            return items.slice(Math.ceil(items.length / 2), items.length);
        }
    }


    /*** to sort ***/
    /**** ***** ****/

    $scope.loadAllArticles = function() {
        $scope.sortFrom = null;
        $scope.sortTo = null;

        if($scope.list==undefined) $scope.askApi('get', '/api/articles/', {}, function(resp) {
            $scope.list = resp.data;
            // $scope.models = {
            //     selected: null,
            //     lists: {"A": [], "B": []}
            // };

            // Generate initial model
            // for (var i = 1; i <= 3; ++i) {
            //     $scope.models.lists.A.push({label: "Item A" + i});
            //     $scope.models.lists.B.push({label: "Item B" + i});
            // }
            // return $scope.models;

        });
    }

    // Model to JSON for demo purpose
    // $scope.$watch('models', function(model) {
    //     $scope.modelAsJson = angular.toJson(model, true);
    // }, true);

    $scope.dragCallback = function(index, item, external) {
        $scope.sortFrom = index;
        return true;
    };

    $scope.dropCallback = function(index, item, external) {
        $scope.sortTo = index;
        console.log($scope.sortFrom + ' -> ' + $scope.sortTo);

        if($scope.sortFrom+1<$scope.sortTo) {
            for(var i=$scope.sortFrom+1; i < $scope.sortTo; i++) {
                var article = $scope.list[i];
                $scope.askApi('put', '/api/articles/' + article._id, {'position': i-1 }, function (data) { });
            }
            $scope.askApi('put', '/api/articles/' + $scope.list[$scope.sortFrom]._id , {'position': $scope.sortTo }, function (data) { });
        }
        else if($scope.sortFrom>$scope.sortTo) {
            for(var i=$scope.sortFrom-1; i >= $scope.sortTo; i--) {
                var article = $scope.list[i];
                $scope.askApi('put', '/api/articles/' + article._id, {'position': i+1 }, function (data) { });
            }
            $scope.askApi('put', '/api/articles/' + $scope.list[$scope.sortFrom]._id , {'position': $scope.sortTo }, function (data) { });
        }
        //

        return item;
    };

    /****** * ******/
}]);

/**
 * Add poem
 */
app.controller('ModalDemoCtrl', function ($uibModal, $log, $document) {
    var $ctrl = this;
    $ctrl.items = ['item1', 'item2', 'item3'];

    $ctrl.animationsEnabled = true;

    $ctrl.open = function (size, parentSelector) {
        var parentElem = parentSelector ?
            angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
        var modalInstance = $uibModal.open({
            animation: $ctrl.animationsEnabled,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl',
            size: size,
            appendTo: parentElem,
            resolve: {
                items: function () {
                    return $ctrl.items;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $ctrl.selected = selectedItem;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $ctrl.openComponentModal = function () {
        var modalInstance = $uibModal.open({
            animation: $ctrl.animationsEnabled,
            component: 'modalComponent',
            resolve: {
                items: function () {
                    return $ctrl.items;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $ctrl.selected = selectedItem;
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    };

    $ctrl.toggleAnimation = function () {
        $ctrl.animationsEnabled = !$ctrl.animationsEnabled;
    };

});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($uibModalInstance, items) {
    var $ctrl = this;
    $ctrl.items = items;
    $ctrl.selected = {
        item: $ctrl.items[0]
    };

    $ctrl.ok = function () {
        $uibModalInstance.close($ctrl.selected.item);
    };

    $ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

// Please note that the close and dismiss bindings are from $uibModalInstance.

app.component('modalComponent', {
    templateUrl: 'myModalContent.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
    controller: function () {
        var $ctrl = this;

        sudo$ctrl.$onInit = function () {
            $ctrl.items = $ctrl.resolve.items;
            $ctrl.selected = {
                item: $ctrl.items[0]
            };
        };

        $ctrl.ok = function () {
            $ctrl.close({$value: $ctrl.selected.item});
        };

        $ctrl.cancel = function () {
            $ctrl.dismiss({$value: 'cancel'});
        };
    }
});

// slick init
function createSlick(){

    $(".slider").not('.slick-initialized').slick({
        autoplay: false,
        dots: true,
        responsive: [{
            breakpoint: 500,
            settings: {
                dots: false,
                arrows: false,
                infinite: false,
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }]
    });

}

function ga_move(url, title) {
    if(ga !== undefined) {
        ga('set', {page: url, title: title});
        ga('send', 'pageview');
    }
}

// createSlick();

//Now it will not throw error, even if called multiple times.
// $(window).on( 'resize', createSlick );

