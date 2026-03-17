# SC-001, SC-002, SC-003
@functional
Feature: Dual Analyst — API Functional

  Background:
    Given the SportIQ API is running
    And the analyst temperature is configured

  # SC-001 | AC: SCRUM-13 SC-001
  @functional @p1 @football
  Scenario: Valid football question returns both analyst perspectives
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then the response status should be 200
    And both analysts should respond with content
    And the response should echo back the sport and question

  # SC-002 | AC: SCRUM-13 SC-002
  @functional @p1 @cricket
  Scenario: Valid cricket question returns both analyst perspectives
    When I send a valid cricket question
    And I send the request
    And I attach the request and response
    Then the response status should be 200
    And both analysts should respond with content
    And the response should echo back the sport and question

  # SC-003 | AC: SCRUM-13 SC-003
  @functional @p1 @tennis
  Scenario: Valid tennis question returns both analyst perspectives
    When I send a valid tennis question
    And I send the request
    And I attach the request and response
    Then the response status should be 200
    And both analysts should respond with content
    And the response should echo back the sport and question
