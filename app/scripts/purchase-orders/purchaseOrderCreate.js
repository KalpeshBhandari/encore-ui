angular.module('billingApp')
    /**
     * @ngdoc directive
     * @name billingApp:rxPurchaseOrderCreate
     * @restrict E
     *
     * @description
     * Sets the trigger for the make payment modal to be popped up.
     * @param {model} userName - User performing the action, for display purposes only
     * @param {String} classes - CSS Classes to be added to the trigger
     * @param {String} currentPurchaseOrder - The current purchase order for display purposes
     * @param {String} notificationStack - Stack to notify after modal has been closed
     * @param {expression} postHook - PostHook function to call upon succesful closing of the modal
     *
     * @example
     * <pre>
     *    <rx-purchase-order-create
     *        userName="{{userName}}"
     *        classes="button button-green"
     *        current-purchase-order="{{currentPurchaseOrder.poNumber}}"
     *        post-hook="refreshPurchaseOrders()"
     *        <strong>+</strong> Create Purchase Order
     *    </rx-purchase-order-create>
     * </pre>
     */
    .directive('rxPurchaseOrderCreate', function () {
        return {
            requires: 'encore.ui.rxModalAction',
            restrict: 'E',
            templateUrl: 'views/purchase-orders/purchaseOrderCreate.html',
            transclude: true,
            scope: {
                userName: '=',
                classes: '@',
                currentPurchaseOrder: '@',
                notificationStack: '@',
                postHook: '&'
            }
        };
    }).controller('PurchaseOrderCreateCtrl', function ($scope, $routeParams, PurchaseOrder,
        rxNotify, BillingErrorResponse, AccountNumberUtil, STATUS_MESSAGES) {
        var RAN = AccountNumberUtil.getRAN($routeParams.accountNumber),
            notifyInstances = {},
            defaultStackName = 'purchaseOrderCreate';

        // Clears the notifications stacks that are being used by this controller
        var clearNotifications = function () {
                if (!_.isEmpty(rxNotify.stacks[defaultStackName])) {
                    rxNotify.clear(defaultStackName);
                }

                // Only attempt to clear the notificationStack if it has been passed in
                if ($scope.notificationStack && !_.isEmpty(rxNotify.stacks[$scope.notificationStack])) {
                    rxNotify.clear($scope.notificationStack);
                }
            },
            // Show a notification error within the modal
            createError = function (response) {
                var msg = STATUS_MESSAGES.purchaseOrders.createError,
                    error = BillingErrorResponse(response);

                // #NOTE: This may change once Billing API has Repose in front of it
                if (error.msg !== '') {
                    msg += ' "' + error.msg + '".';
                }
                rxNotify.add(msg, {
                    stack: defaultStackName,
                    type: 'error'
                });
            },
            createSuccess = function (data) {
                var stack = $scope.notificationStack || defaultStackName;
                rxNotify.add(STATUS_MESSAGES.purchaseOrders.createSuccess, {
                    stack: stack,
                    type: 'success'
                });
                $scope.$close(data);
            },
            createPurchaseOrder = function () {
                // We clear the notification stacks used by us so that we don't let them stack up
                clearNotifications();

                // Capture the instance of the loading notification in order to dismiss it once done processing
                notifyInstances.loading = rxNotify.add(STATUS_MESSAGES.purchaseOrders.create, {
                    stack: defaultStackName,
                    loading: true
                });

                $scope.newPO = PurchaseOrder.createPO(RAN,
                                                   $scope.fields.purchaseOrderNumber,
                                                   createSuccess,
                                                   createError);

                $scope.newPO.$promise.finally(function () {
                    rxNotify.dismiss(notifyInstances.loading);
                });
                // Call the postHook (if) defined on succesful result of createPO
                if ($scope.postHook) {
                    $scope.newPO.$promise.then($scope.postHook);
                }
            };

        clearNotifications();

        $scope.submit = createPurchaseOrder;
        $scope.cancel = $scope.$dismiss;
    });