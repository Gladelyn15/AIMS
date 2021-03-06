﻿app.controller("myCtrl", function ($scope, $http) {
    var vm = this;  
    $scope.requisition;

    $scope.initialize = function () {
        $scope.page;
        $scope.loadpage(1, true);
        //var data =
        //   {
        //       Status: "Approved"
        //   };
        //$http.post('/Reviewer/ViewAllRequisition', data).then(
        //    function successCallback(response) {
        //        $scope.requisitions = response.data;
        //        if ($scope.requisitions.length > 1) {
        //            text = 'You have (' + $scope.requisitions.length + ') new requisition/request received. Click here to view the details...';
        //        } else {
        //            text = 'You have a new requisition/request received. Click here to view the details.';
        //        }
        //        if ($scope.requisitions.length != 0) {
        //            PNotify.desktop.permission();
        //            (new PNotify({
        //                title: 'New Notification',
        //                text: text,
        //                desktop: {
        //                    desktop: true,
        //                }
        //            })).get().click(function (e) {
        //                PNotify.removeAll();
        //                if ($('.ui-pnotify-closer, .ui-pnotify-sticker, .ui-pnotify-closer *, .ui-pnotify-sticker *').is(e.target)) return;
        //                alert('Declined Requests');
        //            });
        //        }
        //    },
        //    function errorCallback(response) {
        //    });
    }

    $scope.pageChange = function (page) {
        $scope.page = page;
        $scope.loadpage(page.PageNumber, page.PageStatus);
    }

    $scope.loadpage = function (pagenumber, pagestatus) {
        var data = {
            pagenumber: pagenumber,
            pagestatus: pagestatus,
            status: "Approved"
        };
        $http.post("/Reviewer/LoadPageData", data).then(
            function successCallback(response) {
                vm.existingSuppliers = [];
                $scope.loadSupplier();
                $scope.requisitions = response.data;
                if ($scope.requisitions.length > 1) {
                    text = 'You have (' + $scope.requisitions.length + ') new requisition/request received. Click here to view the details...';
                } else {
                    text = 'You have a new requisition/request received. Click here to view the details.';
                }
                if ($scope.requisitions.length != 0) {
                    PNotify.desktop.permission();
                    (new PNotify({
                        title: 'New Notification',
                        text: text,
                        desktop: {
                            desktop: true,
                        }
                    })).get().click(function (e) {
                        PNotify.removeAll();
                        if ($('.ui-pnotify-closer, .ui-pnotify-sticker, .ui-pnotify-closer *, .ui-pnotify-sticker *').is(e.target)) return;
                        alert('Declined Requests');
                    });
                }
            },
            function errorCallback(response) {
            }
        );
        $http.post('/Reviewer/LoadPages', data).then(
        function successCallback(response) {
            $scope.pages = response.data;
            if (!$scope.page) {
                $scope.page = $scope.pages[Object.keys($scope.pages)[0]];
            }
        },
        function errorCallback(response) {
        });
    }

    $scope.showViewModal = function (requisition) {
        $scope.requisition = angular.copy(requisition);
        var data =
            {
                requisition: requisition
            };
        $http.post("/Reviewer/RequisitionItem", data).then(
            function successCallback(response) {
                $scope.requisitionItems = response.data;
                $scope.overTotal = 0;
                for (var item in $scope.requisitionItems) {
                    var x = $scope.requisitionItems[item];
                    $scope.overTotal += (x["Quantity"] * x["UnitPrice"]);
                }
                $("#viewModal").modal("show");
            },
            function errorCallback(response) {

            }
        );
    }

    //Close decline modal
    $scope.closeViewModal = function () {
        $("#viewModal").modal("hide");
    }

    //Accept requisition
    $scope.acceptFunction = function (requisitionId, requiredDate, supplierInvoiceNo, deliveryReceiptNo,supplierId) {
        var isValid;
        isValid = requiredDate != undefined && supplierInvoiceNo != undefined && deliveryReceiptNo != undefined;
        if (isValid) {
            for (var i = 0; i < $scope.requisitionItems.length; i++) {
                isValid = $scope.requisitionItems[i].Quantity >= $scope.requisitionItems[i].DeliveredQuantity;
                if (!isValid) break;
            }
            if (!isValid) toastr.warning("Please input valid delivered quantity.", "Invalid Input");
        } else {
            toastr.warning("Please fill out all data.", "Could not be delivered.");
        }

        if (isValid) {
            if ($scope.deliveryType == 'Delivered') {
                var data = {
                    RequisitionID: requisitionId,
                    Status: "Delivered",
                    RequisitionItems: $scope.requisitionItems,
                    DeliveryDate: requiredDate,
                    SupplierInvoiceNo: supplierInvoiceNo,
                    DeliveryReceiptNo: deliveryReceiptNo,
                    SupplierID: supplierId,
                };
                $http.post("/Requisition/DeliverRequisition", data).then(
                    function successCallback(response) {
                        $scope.initialize();
                        $scope.requisitionItems = response.data;
                        $("#viewModal").modal("hide");
                    },
                    function errorCallback(response) {
                    }
                );
            } else {
                var data = {
                    requisitionID: requisitionId,
                    Status: "Partial Delivery",
                    RequisitionItems: $scope.requisitionItems,
                    DeliveryDate: requiredDate,
                    SupplierInvoiceNo: supplierInvoiceNo,
                    DeliveryReceiptNo: deliveryReceiptNo,
                    SupplierID: supplierId
                };
                $http.post("/Requisition/DeliverRequisition", data).then(
                   function successCallback(response) {
                       $scope.initialize();
                       $scope.requisitionItems = response.data;
                       $("#viewModal").modal("hide");
                   },
                   function errorCallback(response) {
                   }
               );
            }
        }
    }

    //Display supplier info modal
    $scope.SupplierInformation = function (item) {
        $scope.supplierInfo = item;
        var data = {
            SupplierID: $scope.supplierInfo.SupplierID
        }
        $http.post("/Reviewer/DisplaySupplierItem", data).then(
                function successCallback(response) {
                    $scope.supplierItems = response.data;
                    //$scope.requisition.SupplierID = $scope.supplier.SupplierId;
                    //$scope.hasSupplier = true;
                    //$scope.initialize();
                    $("#supplierInfoModal").modal("show");
                },
                function errorCallback(response) {

                }
            );
    }
    //Display all existing supplier 
    $scope.loadSupplier = function () {
        $http.post('/Reviewer/DisplayCompanyName')
           .then(
       function successCallback(response) {
           $scope.supplierData = response.data;
           for (var i in $scope.supplierData) {
               var supp = $scope.supplierData[i];
               vm.existingSuppliers.push({
                   SupplierName: '' + supp['SupplierName'],
                   SupplierID: supp['SupplierID']
               });
           }
       },
       function errorCallback(response) {
       });
    }
    //Close supplier info modal
    $scope.closeSupplierInfo = function () {
        $("#supplierInfoModal").modal("hide");
    }

    $scope.allSelected = false;
    //Check specific checkbox
    $scope.cbChecked = function () {

        $scope.allSelected = true;
        angular.forEach($scope.requisitionItems, function (v, k) {
            if (!v.isItemSelected) {
                $scope.allSelected = false;
            }
        });
    }
    //Check all checkbox
    $scope.toggleAll = function () {
        var bool = true;
        if ($scope.allSelected) {
            bool = false;
        }
        angular.forEach($scope.requisitionItems, function (v, k) {
            v.isItemSelected = !bool;
            $scope.allSelected = !bool;
        });
    }

    $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
    };
    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    // Disable weekend selection
    function disabled(data) {
        var date = data.date,
          mode = data.mode;
        return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
    }
    $scope.toggleMin = function () {
        $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
        $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
    };
    $scope.toggleMin();
    $scope.open2 = function () {
        $scope.popup2.opened = true;
        $scope.dateOptions.minDate = new Date();
    };
    $scope.setDate = function (year, month, day) {
        $scope.dt = new Date(year, month, day);
    };
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.popup1 = {
        opened: false
    };
    $scope.popup2 = {
        opened: false
    };
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 1);
    $scope.events = [
      {
          date: tomorrow,
          status: 'full'
      },
      {
          date: afterTomorrow,
          status: 'partially'
      }
    ];
    function getDayClass(data) {
        var date = data.date,
          mode = data.mode;
        if (mode === 'day') {
            var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

            for (var i = 0; i < $scope.events.length; i++) {
                var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

                if (dayToCheck === currentDay) {
                    return $scope.events[i].status;
                }
            }
        }

        return '';
    }
});
