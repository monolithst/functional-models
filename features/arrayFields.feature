Feature: Array Property

  Scenario: A model that has an array property is created holding an array of integers and is checked and validated
    Given ArrayModel1 model is used
    When ArrayModelData1 data is inserted
    Then the ArrayProperty property is called on the model
    Then the array values match
      | array | [1,2,3,4,5]|
    Then functions.validate is called
    Then an array of 0 errors is shown

  Scenario: A model that has an array property but has a non-array inserted into it fails validation
    Given ArrayModel1 model is used
    When ArrayModelData2 data is inserted
    Then the ArrayProperty property is called on the model
    Then functions.validate is called
    Then an array of 1 errors is shown

  Scenario: A model that has an array property for integers but an array of strings is inserted into it, it should fail validation
    Given ArrayModel1 model is used
    When ArrayModelData3 data is inserted
    Then the ArrayProperty property is called on the model
    Then functions.validate is called
    Then an array of 1 errors is shown

  Scenario: A model that has an array property that has mixed values it should not fail validation.
    Given ArrayModel2 model is used
    When ArrayModelData4 data is inserted
    Then the ArrayProperty property is called on the model
    Then functions.validate is called
    Then an array of 0 errors is shown

  Scenario: A model that uses the arrayProperty property that has mixed values it should not fail validation.
    Given ArrayModel3 model is used
    When ArrayModelData4 data is inserted
    Then the ArrayProperty property is called on the model
    Then functions.validate is called
    Then an array of 0 errors is shown

  Scenario: A model that uses the arrayProperty with the choice validator should pass validation with no errors.
    Given ArrayModel4 model is used
    When ArrayModelData5 data is inserted
    Then the ArrayProperty property is called on the model
    Then functions.validate is called
    Then an array of 0 errors is shown

  Scenario: A model that uses the arrayProperty with the choice validator should fail validation when one value is outside the choices
    Given ArrayModel4 model is used
    When ArrayModelData6 data is inserted
    Then the ArrayProperty property is called on the model
    Then functions.validate is called
    Then an array of 1 errors is shown
