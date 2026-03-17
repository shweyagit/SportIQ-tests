# SC-004 to SC-011, SC-014, SC-015
@negative
Feature: Dual Analyst — Negative and Validation

  Background:
    Given the SportIQ API is running

  # SC-004 | AC: SCRUM-13 SC-004
  @negative @p1
  Scenario: Missing question field returns 400 with descriptive error
    When I send a request with missing question field
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the error message should mention the missing field
    And the response should not contain a stack trace

  # SC-005 | AC: SCRUM-13 SC-005
  @negative @p1
  Scenario: Missing sport field returns 400 with descriptive error
    When I send a request with missing sport field
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the error message should mention the missing field
    And the response should not contain a stack trace

  # SC-006 | AC: SCRUM-13 SC-006
  @negative @p1
  Scenario: Empty question string returns 400
    When I send a request with empty question string
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the response should not contain a stack trace

  # SC-007 | AC: SCRUM-13 SC-007
  @negative @p1
  Scenario: Whitespace only question returns 400
    When I send a request with whitespace only question
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the response should not contain a stack trace

  # SC-008 | AC: SCRUM-13 SC-008
  @negative @p1
  Scenario: Empty sport string returns 400
    When I send a request with empty sport string
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the response should not contain a stack trace

  # SC-009, SC-010 | AC: SCRUM-13 SC-009 SC-010
  @negative @p1
  Scenario Outline: Invalid sport value returns 400
    When I send a request with invalid sport value <sport>
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the response should not contain a stack trace

    Examples:
      | sport      |
      | basketball |
      | rugby      |

  # SC-011 | AC: SCRUM-13 SC-011
  @negative @p1
  Scenario: Wrong HTTP method returns 404 or 405 not 500
    When I send a GET request to the analyse endpoint
    And I attach the request and response
    Then the response status should not be 500
    And the response status should be 404 or 405

  # SC-014 | AC: SCRUM-13 SC-014
  @negative @p1
  Scenario: Empty request body returns 400 not 500
    When I send an empty request body
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the response should not contain a stack trace

  # SC-015 | AC: SCRUM-13 SC-015
  @negative @p1
  Scenario Outline: Error responses never contain a stack trace
    When I send a request with <invalid_input>
    And I send the request
    And I attach the request and response
    Then the response should not contain a stack trace
    And the response should not expose internal file paths

    Examples:
      | invalid_input            |
      | missing question field   |
      | missing sport field      |
      | empty question string    |
      | whitespace only question |
      | empty sport string       |
      | invalid sport value basketball |
      | empty request body       |
