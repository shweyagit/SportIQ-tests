# SC-012, SC-013
@schema
Feature: Dual Analyst — Schema and Contract

  Background:
    Given the SportIQ API is running
    And the analyst temperature is configured

  # SC-012 | AC: SCRUM-13 SC-012
  @schema @p1
  Scenario: Response schema contains all required fields with correct types
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then the response status should be 200
    And the response should match the analyst schema
    And the response should contain no additional fields

  # SC-013 | AC: SCRUM-13 SC-013
  @schema @p1
  Scenario: Sport and question are echoed back unchanged in the response
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then the response status should be 200
    And the response sport should match the request sport exactly
    And the response question should match the request question exactly
