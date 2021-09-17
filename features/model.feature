Feature: Models

  Scenario: A Model With a 4 fields
    Given TestModel1 is used
    When TestModel1b data is inserted
    Then TestModel1b expected fields are found

