Feature: Smart Object Prototypes

  Scenario: An example smart object prototype is created and checked for expected properties and is validated.
    Given the prototype TestPrototype1 is used
    When the prototype data TestPrototype1a is used to create an instance
    Then the prototype instance has the expected properties for TestPrototype1a
    And the prototype has the expected toJson response for TestPrototype1a
    And the prototype has 0 errors expected
