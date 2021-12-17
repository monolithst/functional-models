Feature: Basic Typescript

  Scenario: A model with properties, instance methods, and model methods works as expected.
    Given model TE_FULL_TEST is used
    When a model instance is created is called on model with TE_FULL_TEST_1
    And toObj is called on the model instance
    And instance method myMethod is called
    And model method myModelMethod is called
    And validate is called on model instance
    Then the results match TE_FULL_TEST_1 obj data
    And the result of instance method is InstanceMethod
    And the result of model method is ModelMethod
    And the model instance validated successfully

  Scenario: Create an object, call toObj, and then create another object with these results without having to "Force it"
    Given model TE_TEST is used
    When a model instance is created is called on model with TE_TEST_1
    And toObj is called on the model instance
    And another model instance is created from the toObj data
    And toObj is called on another model instance
    Then the results of the two toObj calls are compared successfully
