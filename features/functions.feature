Feature: Functions

  Scenario: A model with 2 properties (name, id), 2 model functions (modelWrapper, toString), and 2 instance functions (toString, toJson)
    Given FunctionModel1 model is used
    When FunctionModelData1 data is inserted
    Then name property is found
    And id property is found
    And toString instance function is found
    And toJson instance function is found
    And modelWrapper model function is found
