angular.module('billingApp')
    /**
    * @ngdoc object
    * @name encore:controller.UsageCtrl
    * @description
    * The Controller which displays an overview of a users' billing info.
    *
    * @requires $scope - The $scope variable for interacting with the UI.
    * @requires $routeParams - AngularJS service which provides access to route paramters
    * @requires billingSvcs.EstimatedCharges - Service for CRUD operations for the Estimated Charges resource.
    * @requires billingSvcs.STATUS_MESSAGES - Constant object defining messaging to be used throughout the app
    *
    * @example
    * <pre>
    * .controller('UsageCtrl', function ($scope, $routeParams, EstimatedCharges)
    * </pre>
    */
    .controller('UsageCtrl', function ($scope, $routeParams, $q, EstimatedCharges,
            Period, rxSortUtil, rxPromiseNotifications, AccountNumberUtil,
            STATUS_MESSAGES, DATE_FORMAT) {

        // TODO: This should be handled at the $resource level, so that the controller
        // passes the $routeParams.accountNumber, and the resource retrieves the type of
        // account number it needs.
        var RAN = AccountNumberUtil.getRAN($routeParams.accountNumber);

        // Set the default sort of the usage
        $scope.sort = rxSortUtil.getDefault('name | ProductName', false);

        /**
        * Get Charges Info
        *
        * Here we find the current billing period from the list we retrieve.
        * We use the period's ID to make a call to receive the estimated
        * charges for the current billing period of the account.
        * Right now, there is no Current Charges Billing API.
        */
        var getCharges = function (periods) {
            $scope.currentPeriod = _.find(periods, { 'current': true });
            if ($scope.currentPeriod) {
                $scope.charges = EstimatedCharges.list({
                    id: RAN,
                    periodId: $scope.currentPeriod.id
                });
            }
        };

        $scope.sortCol = function (predicate) {
            return rxSortUtil.sortCol($scope, predicate);
        };

        // Default Date Format
        $scope.defaultDateFormat = DATE_FORMAT;

        $scope.periods = Period.list({ id: RAN }, getCharges);

        // Group the promises in $q.all for a global error message if any errors occur
        rxPromiseNotifications.add($q.all([
            $scope.periods.$promise
        ]), {
            loading: '',
            error: STATUS_MESSAGES.overview.error
        }, 'usagePage');
    });