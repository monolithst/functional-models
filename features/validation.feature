Feature: Validation

  Scenario: Creating TestModel1 with required arguments but not having them.
    Given the TestModel1 has been created, with TestModel1a inputs provided
    When functions.validate is called
    Then an array of 2 errors is shown

  Scenario: Creating TestModel1 with required arguments and having them.
    Given the TestModel1 has been created, with TestModel1b inputs provided
    When functions.validate is called
    Then an array of 0 errors is shown
