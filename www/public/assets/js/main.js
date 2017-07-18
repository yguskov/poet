/**
 * Created by yguskov on 22.06.17.
 */

var app = angular.module('myApp', ['ui.bootstrap', 'ngAnimate'/*, 'ngRoute'*/]).filter('nl2br', ['$sce', function($sce){
    return function(val) {
        var str =  val.replace(/\n/g, '<br>');
        return $sce.trustAsHtml(str);
    };
}]);


//     , function(){
//     return function(text) {
//         $sce.trustAsHtml(val)
//         return text ? text.replace(/\n/g, '<br>') : '';
//     };
// });

app.controller('common', [ '$scope', '$http', '$location', '$window', function($scope, $http, $location, $window) {
    $scope.firstName= "A ";
    $scope.lastName= "G";
    $scope.title = $scope.firstName + ' ' + $scope.lastName;
    $scope.active = '#about';

    $scope.selectMenu = function(id) {
        switch (id) {
            case '#about' :
                break;

            case '#all' :
                $http.get('http://agu.181.rsdemo.ru/api/articles/', { headers: { Authorization:'Bearer '+localStorage.getItem('token') } }).then(function(resp) {
                    $scope.list = resp.data;
                });
                break;
        }
    };

    $scope.edit = function(id) {
        if(id!=0) {
            $http.get('http://agu.181.rsdemo.ru/api/articles/' + id, {headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}}).then(function (resp) {
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
//            $location.path('http://agu.181.rsdemo.ru/#!?poem='+id);
            $location.search('poem', id);
            console.log($location.absUrl());
            $window.location.reload();
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
            $http.post('http://agu.181.rsdemo.ru/api/articles', $scope.model, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'} })
                .then(function (resp) {
                    $scope.list.push(resp.data.article);
                    $('#edit').fadeOut(300, function () {
                        $('#all').fadeIn(600);
                    });
                });
        }
        else {
            $http.put('http://agu.181.rsdemo.ru/api/articles/' + $scope.model._id, $scope.model, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json'} })
                .then(function (resp) {
                    var i = $scope.list.findIndex(function(item) { return item._id==resp.data.article._id });
                    $scope.list[i] = resp.data.article;

                    $('#edit').fadeOut(300, function () {
                        $('#all').fadeIn(600);
                    });
            });
        }

        //
        // $http.put('http://agu.181.rsdemo.ru/api/articles/'+id, { headers: { Authorization:'Bearer '+localStorage.getItem('token') } }).then(function(resp) {
        //     $scope.model = resp.data.article;
        //     $('#all').fadeOut( 300, function() {
        //         $('#edit').fadeIn(600);
        //     });
        // });
    };

    $scope.isDefined = function (thing) {
        return !(typeof thing === "undefined");
    };
}]);

app.controller('search', [ '$scope', '$http', '$location', function($scope, $http, $location) {
    $scope.selected = undefined;
    $scope.states = [];
    $scope.stems = [];

    if(true || localStorage.getItem('token')==undefined) {
        $http.post('http://agu.181.rsdemo.ru/api/oauth/token', {
            grant_type: 'password',
            client_id: 'android',
            client_secret: 'SomeRandomCharsAndNumbers',
            username: 'myapi',
            'password': 'abc1234'
        }, {headers: {'Content-Type': 'application/json'}}).then(function (resp) {
            localStorage.setItem('token', resp.data.access_token);
            console.log(1);
            if($location.search().poem!=undefined) {
                console.log(2);
                $http.get('http://agu.181.rsdemo.ru/api/articles/' + $location.search().poem, {headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}}).then(function (resp) {
                    $scope.article = resp.data.article;
                    $scope.article.quatrains = resp.data.article.text.split("\n\n");
                    current_item = 1;
                    $('section').hide();
                    $('#about').show();
                });
            }

        });
    }


    var stemmer = new RussianStemmer();

    $scope.init = function () {

//            var req = {
//                method: 'POST',
//                url: 'http://agu.181.rsdemo.ru/api/oauth/token',
//                headers: {
//                    'Content-Type': 'application/json'
//                },
//                data: {test: 'test'}
//            };
//
//            $http(req).then(function() { alert('success'); }, function(){  });
        // http POST http://localhost:1337/api/oauth/token

    };

    $scope.onedit = function() {
        $scope.states = [];
        $scope.stems = [];
        if($scope.selected.length>2) {
            $scope.selected.split(' ').forEach(function (word) {
                $scope.stems.push(stemmer.stemWord(word));
            });
            $http.get('http://agu.181.rsdemo.ru/api/articles/search/'+ $scope.selected, { headers: { Authorization:'Bearer '+localStorage.getItem('token') } }).then(function(resp) {
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
        var article = $scope.states[$index];

        $location.search('poem', $scope.states[$index].id);
        $scope.states = [];
        if($scope.article != undefined) $('#poem').fadeOut( 300, function() {
            $('#poem').fadeIn(600);
            $scope.article = { title: article.title, quatrains: article.text.split("\n\n") };
            $scope.$apply();
        });
        else
            $scope.article = { title: article.title, quatrains: article.text.split("\n\n") };
    };

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


